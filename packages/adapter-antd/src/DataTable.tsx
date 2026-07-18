import {
  ACTIONS_COLUMN_KEY,
  type ColumnDef,
  DEFAULT_CARD_SIZE_PX,
  type FilterRuntime,
  isDeclarativeFilters,
  makeExportCsvHandler,
  pageSizeOptions,
  resolveLabels,
  rowClickProps,
  type RowExpansionState,
  type SelectionState,
  type TableLabels,
  tableMinWidth,
  type TableSource,
  type UrlStateAdapter,
  useChromeScrollReset,
  type UseColumnLayoutResult,
  type UseDataTableResult,
  useFilterTriggerToggle,
  useInfiniteScroll,
  useMountStagger,
  type UseSavedViewsOptions,
  useTableChrome,
  useTableData,
  useTableVirtualization,
} from "@adapttable/core";
import {
  Button,
  Checkbox,
  Empty,
  Flex,
  Pagination,
  Select,
  Space,
  Table,
  type TableProps,
  Typography,
} from "antd";
import {
  type ReactNode,
  type UIEventHandler,
  useMemo,
  useRef,
  useState,
} from "react";

import { buildColumns, logicalAlign } from "./columns";
import { AutoFilterForm } from "./components/AutoFilterForm";
import {
  BulkBar,
  Chips,
  ErrorState,
  FilterDrawer,
  Toolbar,
} from "./components/chrome";
import { ColumnMenu } from "./components/ColumnMenu";
import { ExpandToggle } from "./components/ExpandToggle";
import { MobileCards } from "./components/MobileCards";
import { SavedViewsMenu } from "./components/SavedViewsMenu";
import { SkeletonTable } from "./components/SkeletonTable";
import type { DataTableProps } from "./types";

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

/** The URL adapter the table should use — none at all when sync is off. */
function resolveUrlAdapter(
  urlSync: boolean | undefined,
  adapter: UrlStateAdapter | undefined
): UrlStateAdapter | undefined {
  return urlSync === false ? undefined : adapter;
}

/** Map antd's `onChange` sort event back onto the source's sort state. */
function sortChangeHandler<TRow>(
  source: TableSource<TRow>
): NonNullable<TableProps<TRow>["onChange"]> {
  // Sorting is the only antd-internal feature left wired (pagination is the
  // split footer, filtering is ours), so every onChange IS a sort event.
  return (_pagination, _filters, sorter) => {
    // antd passes an array only under multi-column sort, which buildColumns
    // never enables — flat() folds both shapes without a dead branch.
    const next = [sorter].flat()[0];
    const key =
      typeof next?.columnKey === "string" ? next.columnKey : undefined;
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
 * Map the shared row-expansion contract onto antd's NATIVE `expandable` API:
 * chrome's id-keyed state drives `expandedRowKeys` (so an open panel survives
 * sorting and paging), the icon toggles back through chrome, and the detail
 * panel renders via `expandedRowRender`. antd's built-in expand icon does
 * carry `aria-expanded` and an `aria-label`, but the label comes from antd's
 * ConfigProvider locale — a custom `expandIcon` keeps the configurable
 * `labels.expandRow` / `labels.collapseRow` contract instead.
 */
function buildExpandable<TRow>(
  renderRowDetail: ((row: TRow) => ReactNode) | undefined,
  expansion: RowExpansionState | undefined,
  getRowId: (row: TRow) => string,
  labels: Required<TableLabels>
): TableProps<TRow>["expandable"] {
  if (!renderRowDetail || !expansion) return undefined;
  return {
    expandedRowKeys: [...expansion.expandedIds],
    onExpand: (_open, row) => expansion.toggle(getRowId(row)),
    expandedRowRender: (row) => renderRowDetail(row),
    expandIcon: ({ expanded, record, onExpand }) => (
      <ExpandToggle
        expanded={expanded}
        labels={labels}
        onClick={(event) => onExpand(record, event)}
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
  hasRowActions,
}: Readonly<{
  enabled: boolean;
  allColumns: ColumnDef<TRow>[];
  layout: UseColumnLayoutResult<TRow>;
  labels: Required<TableLabels>;
  dir?: "ltr" | "rtl";
  hasRowActions: boolean;
}>) {
  if (!enabled) return null;
  return (
    <ColumnMenu
      allColumns={allColumns}
      layout={layout}
      labels={labels}
      dir={dir}
      hasRowActions={hasRowActions}
    />
  );
}

/**
 * The saved-views menu, mounted when the `savedViews` prop opts in. The
 * table's own `urlAdapter` / `urlKey` are the defaults so a captured view
 * holds THIS table's params; explicit options win.
 */
function SavedViewsSlot({
  options,
  urlAdapter,
  urlKey,
  labels,
  dir,
}: Readonly<{
  options: UseSavedViewsOptions | undefined;
  urlAdapter: UrlStateAdapter | undefined;
  urlKey: string | undefined;
  labels: Required<TableLabels>;
  dir?: "ltr" | "rtl";
}>) {
  if (!options) return null;
  return (
    <SavedViewsMenu
      options={{ adapter: urlAdapter, urlKey, ...options }}
      labels={labels}
      dir={dir}
    />
  );
}

/**
 * Whether the page-level load-more sentinel should stay armed. It disarms
 * only while the antd virtual table renders (desktop): there the rows live in
 * antd's own fixed-height scroll container, and `handleVirtualScroll` drives
 * paging instead. Mobile cards window through core virtualization but still
 * flow in the page (no inner scroll box), so the sentinel stays the single
 * load-more trigger there even with `virtualize` set.
 */
function sentinelEnabled(
  isPaged: boolean,
  error: Error | null,
  virtualize: boolean,
  body: string
): boolean {
  return !isPaged && !error && !(virtualize && body === "desktop");
}

/**
 * Map the shared `summaryRow` contract onto antd's NATIVE `summary` slot: one
 * `Table.Summary.Row` whose cells line up under the data columns. antd
 * injects its expand/selection columns at the START of the grid, so the row
 * first pads with one empty cell per injected column, then renders a cell per
 * visible column (keys absent from the result stay empty, logical alignment
 * preserved for RTL), then pads for the trailing actions column.
 */
function buildSummary<TRow>(
  summaryRow:
    | ((rows: readonly TRow[]) => Partial<Record<string, ReactNode>>)
    | undefined,
  columns: readonly ColumnDef<TRow>[],
  leadingCells: number,
  hasActions: boolean
): TableProps<TRow>["summary"] {
  if (!summaryRow) return undefined;
  return function SummaryCells(rows) {
    const cells = summaryRow(rows);
    return (
      <Table.Summary.Row>
        {Array.from({ length: leadingCells }, (_, i) => (
          <Table.Summary.Cell key={`lead-${i}`} index={i} />
        ))}
        {columns.map((column, i) => (
          <Table.Summary.Cell key={column.key} index={leadingCells + i}>
            <div style={{ textAlign: logicalAlign(column.align) }}>
              {cells[column.key]}
            </div>
          </Table.Summary.Cell>
        ))}
        {hasActions && (
          <Table.Summary.Cell index={leadingCells + columns.length} />
        )}
      </Table.Summary.Row>
    );
  };
}

/** How many non-data columns antd injects ahead of ours (expand, selection). */
function summaryLeadingCells(rowSelection: unknown, expandable: unknown) {
  return (rowSelection ? 1 : 0) + (expandable ? 1 : 0);
}

/** The shift-click chain toggler — only when `multiSort` is opted in. */
function chainToggler<TRow>(
  multiSort: boolean | undefined,
  source: TableSource<TRow>
): ((key: string) => void) | undefined {
  if (!multiSort) return undefined;
  return (key) => source.toggleSortLevel(key);
}

/**
 * The split footer every kit shares — rows-per-page + showing on the start
 * side, the pager on the end side — built from antd's own Select and
 * Pagination instead of the table-internal pagination (which crams
 * everything, size changer included, onto one end).
 */
function PagedFooter<TRow>({
  table,
  source,
  labels,
}: Readonly<{
  table: UseDataTableResult<TRow>;
  source: TableSource<TRow>;
  labels: Required<TableLabels>;
}>) {
  const from = (table.pagination.safePage - 1) * source.limit + 1;
  const to = Math.min(table.pagination.safePage * source.limit, source.total);
  return (
    <Flex justify="space-between" align="center" wrap gap={8}>
      <Flex align="center" gap={8}>
        <Typography.Text type="secondary">{labels.rowsPerPage}</Typography.Text>
        <Select
          size="small"
          aria-label={labels.rowsPerPage}
          value={source.limit}
          onChange={(value: number) => source.setLimit(value)}
          options={pageSizeOptions(source.limit).map((n) => ({
            value: n,
            label: n,
          }))}
        />
        {source.total > 0 && (
          <Typography.Text type="secondary">
            {labels.showing({ from, to, total: source.total })}
          </Typography.Text>
        )}
      </Flex>
      <Pagination
        current={table.pagination.safePage}
        pageSize={source.limit}
        total={source.total}
        showSizeChanger={false}
        onChange={(page: number) => source.setPage(page)}
      />
    </Flex>
  );
}

/**
 * The auto-built form for a declarative `filters` array — nothing when the
 * runtime resolved zero definitions (no column shorthands, empty array).
 */
function autoFilterForm<TRow>(
  runtime: FilterRuntime<TRow>,
  source: TableSource<TRow>,
  labels: Required<TableLabels>
) {
  if (runtime.defs.length === 0) return undefined;
  return <AutoFilterForm defs={runtime.defs} source={source} labels={labels} />;
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
 * Windowing props for the mobile card list. Desktop rows window through antd's
 * own native virtual `<Table>`, so this is gated to the card body and never
 * touches that path. Cards flow in the page (no inner scroll box), so the
 * page-level sentinel stays the single load-more trigger — the window needs no
 * second sentinel of its own.
 */
function useCardWindowing<TRow>(options: {
  rows: readonly TRow[];
  rowKey: (row: TRow) => string;
  virtualize: boolean;
  isPaged: boolean;
  error: Error | null;
  body: string;
  estimateCardSize?: number;
  overscan?: number;
  scrollMargin?: number;
}) {
  const virtualization = useTableVirtualization({
    rows: options.rows,
    rowKey: options.rowKey,
    enabled:
      options.virtualize &&
      !options.isPaged &&
      !options.error &&
      options.body === "mobile",
    estimateSize: options.estimateCardSize ?? DEFAULT_CARD_SIZE_PX,
    overscan: options.overscan,
    scrollMargin: options.scrollMargin,
  });
  return {
    rowEntries: virtualization.enabled ? virtualization.rows : undefined,
    paddingTop: virtualization.paddingTop,
    paddingBottom: virtualization.paddingBottom,
    measureElement: virtualization.measureElement,
  };
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
    animate = false,
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
    locale: props.locale,
    source: props.source,
    data: props.data,
    total: props.total,
    loading: props.loading,
    onQueryChange: props.onQueryChange,
    adapter: resolveUrlAdapter(props.urlSync, props.urlAdapter),
    enabled: props.urlSync,
    urlKey: props.urlKey,
    columns: props.columns,
    filters: props.filters,
  });
  // A declarative `filters` array becomes the auto-built form; JSX passes
  // through untouched. Column-level `filter` shorthands alone (no `filters`
  // prop) must still render the form — only explicit JSX takes over. The
  // form needs the resolved labels before `useTableChrome` resolves its own
  // (the chrome consumes the form node), so resolve the same prop here.
  const formLabels = useMemo(() => resolveLabels(props.labels), [props.labels]);
  const filtersNode =
    isDeclarativeFilters(props.filters) || props.filters === undefined
      ? autoFilterForm(runtime, resolvedSource, formLabels)
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
  // The injected actions column is first-class in column management: it lives
  // in the layout state under its reserved key, so hiding it strips the
  // rowActions BEFORE buildColumns — the trailing column, summary spans, and
  // min-width all adjust together. The Columns menu still lists it (from the
  // raw prop) so it can be shown again.
  const rowActions = c.columnLayout.isHidden(ACTIONS_COLUMN_KEY)
    ? undefined
    : props.rowActions;
  const hasRowActions = Boolean(rowActions?.length);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTrigger = useFilterTriggerToggle(filtersOpen, setFiltersOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, c, chromeProps);
  useMountStagger(rootRef, [source.rows.length, c.isMobile], {
    enabled: animate,
  });
  const resolvedTableLabel = table.getTableProps()["aria-label"];
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

  // Window the MOBILE card list with core virtualization — desktop rows still
  // window through antd's own native virtual `<Table>`, so this is gated to
  // the card body and never touches that path. Cards flow in the page (no
  // inner scroll box), so the sentinel above stays the single load-more
  // trigger; the virtual window needs no second sentinel of its own.
  const cardWindow = useCardWindowing({
    rows: source.rows,
    rowKey: getRowId,
    virtualize,
    isPaged: c.isPaged,
    error: source.error,
    body: c.body,
    estimateCardSize: props.estimateCardSize,
    overscan: props.virtualOverscan,
    scrollMargin: props.virtualScrollMargin,
  });

  const columns = buildColumns<TRow>({
    columns: table.columns,
    rowActions,
    sortBy: source.sortBy,
    sortDir: source.sortDir,
    confirm,
    labels,
    pinned: c.columnLayout.state.pinned,
    setWidth: props.resizableColumns ? c.columnLayout.setWidth : undefined,
    columnWidths: c.columnLayout.state.widths,
    resizeLabel: labels.resizeColumn,
    sortLevels: source.sortLevels,
    // Shift-click multi-sort is opt-in; without it antd keeps full control
    // of header clicks (single-sort via `onChange`).
    onToggleSortLevel: chainToggler(props.multiSort, source),
  });
  const pinnedSides = Object.values(c.columnLayout.state.pinned);
  const hasPinned = pinnedSides.length > 0;
  const hasStartPin = pinnedSides.includes("start");
  const minWidth = antdMinWidth(
    table.columns,
    c.columnLayout.state.widths,
    Boolean(table.selection),
    hasRowActions
  );

  const handleChange = sortChangeHandler(source);

  const rowSelection = buildRowSelection(
    selection,
    getRowId,
    labels,
    hasStartPin
  );
  const expandable = buildExpandable(
    c.detail?.render,
    c.detail?.expansion,
    getRowId,
    labels
  );
  // The summary row pads one leading cell per column antd injects (expand
  // first, then selection) so its cells stay aligned under the data columns.
  const summary = buildSummary(
    props.summaryRow,
    table.columns,
    summaryLeadingCells(rowSelection, expandable),
    hasRowActions
  );
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
        hasActions={hasRowActions}
      />
    );
  } else if (c.body === "empty") {
    bodyRegion = slots?.empty ?? <output>{emptyNode}</output>;
  } else if (c.body === "mobile") {
    bodyRegion = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        getRowId={getRowId}
        prefetch={props.prefetch}
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
        tableLabel={resolvedTableLabel}
        compact={(props.density ?? "comfortable") === "compact"}
        expansion={c.detail?.expansion}
        renderRowDetail={c.detail?.render}
        summaryRow={props.summaryRow}
        {...cardWindow}
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
        expandable={expandable}
        summary={summary}
        pagination={false}
        rowClassName={
          props.rowClassName ? buildRowClassName(props.rowClassName) : undefined
        }
        onChange={handleChange}
        onRow={(record) => ({
          ...rowClickProps(record, props.onRowClick),
          "data-stagger": "",
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
      <Space orientation="vertical" size="small" style={{ width: "100%" }}>
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
          onToggleFilters={filtersTrigger.onClick}
          onFiltersTriggerPointerDown={filtersTrigger.onPointerDown}
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
              hasRowActions={Boolean(props.rowActions?.length)}
            />
          }
          onExportCsv={makeExportCsvHandler(
            props.exportCsv,
            source,
            table.columns
          )}
          savedViewsMenu={
            <SavedViewsSlot
              options={props.savedViews}
              urlAdapter={props.urlAdapter}
              urlKey={props.urlKey}
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
            total={source.total}
            bulkActions={props.bulkActions}
            confirm={confirm}
            labels={labels}
          />
        )}
        {bodyRegion}
        {c.isPaged && !source.error && c.body === "desktop" && (
          <PagedFooter table={table} source={source} labels={labels} />
        )}
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
