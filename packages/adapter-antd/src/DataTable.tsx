import {
  type ColumnDef,
  type FilterRuntime,
  isDeclarativeFilters,
  pageSizeOptions,
  rowClickProps,
  type SelectionState,
  type TableLabels,
  tableMinWidth,
  type TableSource,
  useChromeScrollReset,
  type UseColumnLayoutResult,
  type UseDataTableResult,
  useInfiniteScroll,
  useTableChrome,
  useTableData,
} from "@adapttable/core";
import {
  Button,
  Checkbox,
  Empty,
  Flex,
  Skeleton,
  Space,
  Table,
  type TableProps,
} from "antd";
import {
  type CSSProperties,
  type ReactNode,
  type UIEventHandler,
  useMemo,
  useRef,
  useState,
} from "react";

import { buildColumns } from "./columns";
import { AutoFilterForm } from "./components/AutoFilterForm";
import {
  BulkBar,
  Chips,
  ErrorState,
  FilterDrawer,
  Toolbar,
} from "./components/chrome";
import { ColumnMenu } from "./components/ColumnMenu";
import { MobileCards } from "./components/MobileCards";
import type { DataTableProps } from "./types";

/** Visually-hidden style for the screen-reader loading announcement. */
const SR_ONLY: CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  padding: 0,
  margin: -1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
  border: 0,
};

/**
 * antd renders virtual rows inside its own fixed-height scroll container, so
 * the page-level infinite-scroll sentinel never reaches the viewport. This
 * pages in the next slice when that internal scroll nears its end instead.
 */
function virtualScrollEndHandler<TRow>(
  source: TableSource<TRow>,
  active: boolean
): UIEventHandler<HTMLElement> {
  return (event) => {
    if (!active) return;
    const el = event.currentTarget;
    if (
      source.hasNextPage &&
      !source.isFetchingNextPage &&
      el.scrollHeight - el.scrollTop - el.clientHeight <= 80
    ) {
      source.fetchNextPage();
    }
  };
}

/**
 * Adapt the shared `(row, index) => string | undefined` contract to antd's
 * `rowClassName`, which expects a string for every row.
 */
function buildRowClassName<TRow>(
  rowClassName: (row: TRow, index: number) => string | undefined
): (record: TRow, index: number) => string {
  return (record, index) => rowClassName(record, index) ?? "";
}

/**
 * Variant-aware empty state: `"noResults"` (zero rows under an active
 * search/filter) names the cause and offers a clear-filters CTA;
 * `"noData"` stays the plain antd `Empty`.
 */
function EmptyState({
  variant,
  labels,
  onClearFilters,
}: Readonly<{
  variant: "noData" | "noResults";
  labels: Required<TableLabels>;
  onClearFilters: () => void;
}>) {
  if (variant === "noData") return <Empty description={labels.noData} />;
  return (
    <Empty description={labels.noResults}>
      <Button onClick={onClearFilters}>{labels.clearAll}</Button>
    </Empty>
  );
}

/** Map antd's `onChange` sort event back onto the source's sort state. */
function sortChangeHandler<TRow>(
  source: TableSource<TRow>
): NonNullable<TableProps<TRow>["onChange"]> {
  return (_pagination, _filters, sorter, extra) => {
    if (extra.action !== "sort") return;
    // antd passes an array only under multi-column sort, which buildColumns
    // never enables — flat() folds both shapes without a dead branch.
    const next = [sorter].flat()[0];
    const key = next?.columnKey as string | undefined;
    if (!key || !next?.order) {
      source.setSort(undefined);
      return;
    }
    source.setSort(key, next.order === "descend" ? "desc" : "asc");
  };
}

/** Summed min-width of fixed-width columns, plus the selection/actions cols. */
function antdMinWidth<TRow>(
  columns: readonly ColumnDef<TRow>[],
  widths: Readonly<Record<string, number>>,
  hasSelection: boolean,
  hasActions: boolean
): number {
  return tableMinWidth(columns, {
    widths,
    extra: (hasSelection ? 48 : 0) + (hasActions ? 120 : 0),
  });
}

/** antd scroll config: virtual sizing, else x for pinning + y for the box. */
function resolveScroll(
  virtualize: boolean,
  virtualWidth: number,
  virtualHeight: number,
  hasPinned: boolean,
  maxHeight: number | undefined,
  minWidth: number
): NonNullable<TableProps<unknown>["scroll"]> {
  // Virtual rows need explicit x/y so antd can size its internal scroller.
  if (virtualize) return { x: virtualWidth, y: virtualHeight };
  // Pinning needs content-driven width; otherwise a fixed-width column set
  // gets its summed min-width so the table scrolls instead of squishing.
  let x: number | "max-content" | undefined;
  if (hasPinned) x = "max-content";
  else if (minWidth > 0) x = minWidth;
  return { x, y: maxHeight };
}

/** Build antd's rowSelection from the headless selection state. */
function buildRowSelection<TRow>(
  selection: SelectionState | null | undefined,
  getRowId: (row: TRow) => string,
  labels: Required<TableLabels>,
  fixedLeft: boolean
): TableProps<TRow>["rowSelection"] {
  if (!selection) return undefined;
  return {
    // Pin the checkbox column alongside any left-fixed data column.
    fixed: fixedLeft ? "left" : undefined,
    selectedRowKeys: [...selection.selectedIds],
    onSelect: (record) => selection.toggle(getRowId(record)),
    getCheckboxProps: () => ({ title: labels.selectRow }),
    // Select-all is driven by the custom `columnTitle` checkbox below; with
    // `columnTitle` set antd never renders its own header checkbox, so an
    // `onSelectAll` callback could never fire.
    columnTitle: (
      <Checkbox
        aria-label={labels.selectAll}
        checked={selection.headerState === "all"}
        indeterminate={selection.headerState === "some"}
        onChange={() => selection.toggleAll()}
      />
    ),
  };
}

/**
 * The column-management menu, gated to desktop + opt-in. Rendered as a
 * component (not an inline ternary) so the `DataTable` body stays flat.
 */
function ColumnMenuSlot<TRow>({
  enabled,
  allColumns,
  layout,
  labels,
  dir,
}: Readonly<{
  enabled: boolean;
  allColumns: ColumnDef<TRow>[];
  layout: UseColumnLayoutResult<TRow>;
  labels: Required<TableLabels>;
  dir?: "ltr" | "rtl";
}>) {
  if (!enabled) return null;
  return (
    <ColumnMenu
      allColumns={allColumns}
      layout={layout}
      labels={labels}
      dir={dir}
    />
  );
}

/**
 * Whether the page-level load-more sentinel should stay armed. It disarms
 * only while the antd virtual table renders (desktop): there the rows live in
 * antd's own fixed-height scroll container, and `handleVirtualScroll` drives
 * paging instead. Mobile cards are never virtualized, so the sentinel keeps
 * auto-loading there even with `virtualize` set.
 */
function sentinelEnabled(
  isPaged: boolean,
  error: Error | null,
  virtualize: boolean,
  body: string
): boolean {
  return !isPaged && !error && !(virtualize && body === "desktop");
}

/** Build antd's pagination config (undefined in infinite mode → `false`). */
function buildPagination<TRow>(
  isPaged: boolean,
  table: UseDataTableResult<TRow>,
  source: TableSource<TRow>,
  labels: Required<TableLabels>
) {
  if (!isPaged) return undefined;
  return {
    current: table.pagination.safePage,
    pageSize: source.limit,
    total: source.total,
    showSizeChanger: true,
    pageSizeOptions: pageSizeOptions(source.limit).map(String),
    showTotal: (total: number, range: [number, number]) =>
      labels.showing({ from: range[0], to: range[1], total }),
    onChange: (page: number, pageSize: number) => {
      if (pageSize === source.limit) source.setPage(page);
      else source.setLimit(pageSize);
    },
  };
}

function skeletonLineWidth(isActions: boolean, index: number): string {
  if (isActions) return "72px";
  if (index === 0) return "70%";
  return "55%";
}

function skeletonWidth(index: number, total: number): string {
  if (index === 0) return "34%";
  if (index === total - 1) return "12%";
  return `${Math.max(12, Math.floor(72 / Math.max(total - 2, 1)))}%`;
}

function SkeletonTable({
  columnCount,
  rowCount,
  loadingLabel,
  size,
  bordered,
  hasActions,
}: Readonly<{
  columnCount: number;
  rowCount: number;
  loadingLabel: string;
  size: "small" | "middle" | "large";
  bordered: boolean;
  hasActions?: boolean;
}>) {
  const dataColumns = Math.max(columnCount, 1);
  const totalColumns = dataColumns + (hasActions ? 1 : 0);
  const skeletonColumns = Array.from({ length: totalColumns }, (_, i) => {
    const isActions = Boolean(hasActions && i === totalColumns - 1);
    const width = isActions ? "96px" : skeletonWidth(i, dataColumns);
    const lineWidth = skeletonLineWidth(isActions, i);
    return {
      key: `skeleton-${i}`,
      width,
      title: (
        <Skeleton.Input active size="small" style={{ width: lineWidth }} />
      ),
      render: () => (
        <Skeleton.Input active size="small" style={{ width: lineWidth }} />
      ),
    };
  });
  const rows = Array.from({ length: rowCount }, (_, i) => ({
    key: `row-${i}`,
  }));
  return (
    <div role="status" aria-busy="true" aria-live="polite">
      <Table
        columns={skeletonColumns}
        dataSource={rows}
        pagination={false}
        size={size}
        bordered={bordered}
      />
      <span style={SR_ONLY}>{loadingLabel}</span>
    </div>
  );
}

/**
 * The auto-built form for a declarative `filters` array — nothing when the
 * runtime resolved zero definitions (no column shorthands, empty array).
 */
function autoFilterForm<TRow>(
  runtime: FilterRuntime<TRow>,
  source: TableSource<TRow>
) {
  if (runtime.defs.length === 0) return undefined;
  return <AutoFilterForm defs={runtime.defs} source={source} />;
}

/**
 * antd table size from the shared `density` contract (independent of column
 * pinning): "compact" → the small table, "comfortable" (default) → the middle
 * one. An explicit `size` prop wins so callers can opt into "large".
 */
function resolveSize(
  size: "small" | "middle" | "large" | undefined,
  density: "comfortable" | "compact" | undefined
): "small" | "middle" | "large" {
  if (size) return size;
  return (density ?? "comfortable") === "compact" ? "small" : "middle";
}

/**
 * Batteries-included Ant Design data table. Drop in `columns`, a `source`,
 * and a `rowKey` for a fully wired antd `<Table>` — sorting, selection,
 * filtering, URL-synced state, RTL, and dark mode — on the headless
 * `@adapttable/core` engine. Unlike the hand-rolled adapters, this one
 * drives antd's high-level `<Table>` (its own header carets, row checkboxes,
 * loading, empty state, and pagination), wiring those back to the source.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const {
    slots,
    className,
    bordered = false,
    virtualize = false,
    virtualHeight = 480,
    virtualWidth = 960,
  } = props;
  const size = resolveSize(props.size, props.density);
  const filtersMode = props.filtersMode ?? "popover";
  // Resolve the data tier (source > onQueryChange server > frontend data)
  // and the declarative-filter runtime; everything below — pagination, row
  // selection, the sentinel — uses the RESOLVED source via `table.source`.
  const { source: resolvedSource, runtime } = useTableData<TRow>({
    source: props.source,
    data: props.data,
    total: props.total,
    loading: props.loading,
    onQueryChange: props.onQueryChange,
    adapter: props.urlAdapter,
    urlKey: props.urlKey,
    columns: props.columns,
    filters: props.filters,
  });
  // A declarative `filters` array becomes the auto-built form; JSX passes
  // through untouched. Column-level `filter` shorthands alone (no `filters`
  // prop) must still render the form — only explicit JSX takes over.
  const filtersNode =
    isDeclarativeFilters(props.filters) || props.filters === undefined
      ? autoFilterForm(runtime, resolvedSource)
      : props.filters;
  const filterLabels = useMemo(
    () => ({ ...runtime.filterLabels, ...props.filterLabels }),
    [runtime.filterLabels, props.filterLabels]
  );
  const chromeProps = {
    ...props,
    source: resolvedSource,
    filters: filtersNode,
    filterLabels,
  };
  const c = useTableChrome<TRow>(chromeProps);
  const { table, confirm, getRowId } = c;
  const { labels, source, selection } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, c, chromeProps);
  const resolvedTableLabel = table.getTableProps()["aria-label"] as string;
  // In virtual mode the rows live inside antd's own fixed-height scroll
  // container, so the page-level sentinel never reaches the viewport — the
  // internal scroll (`handleVirtualScroll`) drives paging instead. Disable
  // the sentinel there to avoid an eager fetch from the always-visible button.
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: () => source.fetchNextPage(),
    itemCount: source.rows.length,
    enabled: sentinelEnabled(c.isPaged, source.error, virtualize, c.body),
  });

  const handleVirtualScroll = virtualScrollEndHandler(
    source,
    virtualize && !c.isPaged && !source.error
  );

  const columns = buildColumns<TRow>({
    columns: table.columns,
    rowActions: props.rowActions,
    sortBy: source.sortBy,
    sortDir: source.sortDir,
    confirm,
    labels,
    pinned: c.columnLayout.state.pinned,
    setWidth: props.resizableColumns ? c.columnLayout.setWidth : undefined,
    columnWidths: c.columnLayout.state.widths,
    resizeLabel: labels.resizeColumn,
  });
  const pinnedSides = Object.values(c.columnLayout.state.pinned);
  const hasPinned = pinnedSides.length > 0;
  const hasLeftPin = pinnedSides.includes("left");
  const minWidth = antdMinWidth(
    table.columns,
    c.columnLayout.state.widths,
    Boolean(table.selection),
    Boolean(props.rowActions?.length)
  );

  const handleChange = sortChangeHandler(source);

  const rowSelection = buildRowSelection(
    selection,
    getRowId,
    labels,
    hasLeftPin
  );
  const pagination = buildPagination(c.isPaged, table, source, labels) ?? false;
  const sticky: TableProps<unknown>["sticky"] = props.stickyHeader
    ? { offsetHeader: props.stickyTop ?? 0 }
    : undefined;
  const emptyNode = (
    <EmptyState
      variant={c.emptyVariant}
      labels={labels}
      onClearFilters={c.clearFilters}
    />
  );

  let bodyRegion: ReactNode;
  if (source.error) {
    bodyRegion = (
      <ErrorState
        error={source.error}
        labels={labels}
        onRetry={source.refetch ? () => void source.refetch?.() : undefined}
      />
    );
  } else if (c.body === "skeleton") {
    bodyRegion = slots?.skeleton ?? (
      <SkeletonTable
        columnCount={columns.length}
        rowCount={props.skeletonRows ?? source.limit}
        loadingLabel={labels.loading}
        size={size}
        bordered={bordered}
        hasActions={(props.rowActions?.length ?? 0) > 0}
      />
    );
  } else if (c.body === "empty") {
    bodyRegion = slots?.empty ?? <output>{emptyNode}</output>;
  } else if (c.body === "mobile") {
    bodyRegion = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={props.rowActions}
        confirm={confirm}
        getRowId={getRowId}
        prefetch={props.prefetch}
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
        tableLabel={resolvedTableLabel}
        compact={(props.density ?? "comfortable") === "compact"}
      />
    );
  } else {
    bodyRegion = (
      <Table<TRow>
        aria-label={resolvedTableLabel}
        columns={columns}
        dataSource={source.rows}
        rowKey={getRowId}
        size={size}
        bordered={bordered}
        virtual={virtualize}
        sticky={sticky}
        onScroll={handleVirtualScroll}
        rowSelection={rowSelection}
        pagination={pagination}
        rowClassName={
          props.rowClassName ? buildRowClassName(props.rowClassName) : undefined
        }
        onChange={handleChange}
        onRow={(record) => ({
          ...rowClickProps(record, props.onRowClick),
          onMouseEnter: props.prefetch
            ? () => props.prefetch?.(record)
            : undefined,
        })}
        scroll={resolveScroll(
          virtualize,
          virtualWidth,
          virtualHeight,
          hasPinned,
          props.maxHeight,
          minWidth
        )}
        locale={{ emptyText: emptyNode }}
      />
    );
  }

  return (
    <div
      ref={rootRef}
      dir={props.dir}
      className={className}
      aria-busy={c.isRefreshing || undefined}
    >
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Toolbar
          table={table}
          hideSearch={props.hideSearch}
          searchPlaceholder={props.searchPlaceholder}
          sortByOptions={props.sortByOptions}
          customToolbar={props.toolbar}
          hasFilters={Boolean(filtersNode)}
          activeFilterCount={c.activeFilterCount}
          filters={filtersNode}
          filtersMode={filtersMode}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((o) => !o)}
          onCloseFilters={() => setFiltersOpen(false)}
          onClearFilters={c.clearFilters}
          isRefreshing={c.isRefreshing}
          dir={props.dir}
          columnMenu={
            <ColumnMenuSlot
              enabled={Boolean(props.enableColumnMenu) && !c.isMobile}
              allColumns={c.allColumns}
              layout={c.columnLayout}
              labels={labels}
              dir={props.dir}
            />
          }
          showRowsPerPage={!c.isPaged}
        />
        <Chips
          chips={c.mergedChips}
          onClearAll={c.clearFilters}
          labels={labels}
        />
        {selection && props.bulkActions && (
          <BulkBar
            selection={selection}
            bulkActions={props.bulkActions}
            confirm={confirm}
            labels={labels}
          />
        )}
        {bodyRegion}
        {!c.isPaged && !source.error && source.hasNextPage && (
          <Flex ref={loadMoreRef} justify="center">
            <Button
              loading={source.isFetchingNextPage}
              onClick={() => source.fetchNextPage()}
            >
              {labels.loadMore}
            </Button>
          </Flex>
        )}
      </Space>
      {filtersNode && filtersMode === "drawer" && (
        <FilterDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filtersNode}
          activeFilterCount={c.activeFilterCount}
          onClearFilters={c.clearFilters}
          labels={labels}
          dir={props.dir}
        />
      )}
    </div>
  );
}
