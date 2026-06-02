import {
  pageSizeOptions,
  useInfiniteScroll,
  useTableChrome,
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
import { type CSSProperties, type ReactNode, useState } from "react";

import { buildColumns } from "./columns";
import {
  BulkBar,
  Chips,
  ErrorState,
  FilterDrawer,
  Toolbar,
} from "./components/chrome";
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
  const { slots, className, size = "middle", bordered = false } = props;
  const c = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = c;
  const { labels, source, selection } = table;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: () => source.fetchNextPage(),
    itemCount: source.rows.length,
    enabled: !c.isPaged && !source.error,
  });

  const columns = buildColumns<TRow>({
    columns: table.columns,
    rowActions: props.rowActions,
    sortBy: source.sortBy,
    sortDir: source.sortDir,
    confirm,
    labels,
  });

  const handleChange: TableProps<TRow>["onChange"] = (
    _pagination,
    _filters,
    sorter,
    extra
  ) => {
    if (extra.action !== "sort") return;
    const next = Array.isArray(sorter) ? sorter[0] : sorter;
    const key = next?.columnKey as string | undefined;
    if (!key || !next?.order) {
      source.setSort(undefined);
      return;
    }
    source.setSort(key, next.order === "descend" ? "desc" : "asc");
  };

  const rowSelection: TableProps<TRow>["rowSelection"] = selection
    ? {
        selectedRowKeys: [...selection.selectedIds],
        onSelect: (record) => selection.toggle(getRowId(record)),
        onSelectAll: () => selection.toggleAll(),
        getCheckboxProps: () => ({ title: labels.selectRow }),
        columnTitle: (
          <Checkbox
            aria-label={labels.selectAll}
            checked={selection.headerState === "all"}
            indeterminate={selection.headerState === "some"}
            onChange={() => selection.toggleAll()}
          />
        ),
      }
    : undefined;

  const pagination: TableProps<TRow>["pagination"] = c.isPaged
    ? {
        current: table.pagination.safePage,
        pageSize: source.limit,
        total: source.total,
        showSizeChanger: true,
        pageSizeOptions: pageSizeOptions(source.limit).map(String),
        showTotal: (total, range) =>
          labels.showing({ from: range[0], to: range[1], total }),
        onChange: (page, pageSize) => {
          if (pageSize === source.limit) source.setPage(page);
          else source.setLimit(pageSize);
        },
      }
    : false;

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
      <div role="status" aria-busy="true" aria-live="polite">
        <Skeleton
          active
          title={false}
          paragraph={{ rows: props.skeletonRows ?? source.limit }}
        />
        <span style={SR_ONLY}>{labels.loading}</span>
      </div>
    );
  } else if (c.body === "empty") {
    bodyRegion = slots?.empty ?? (
      <div role="status">
        <Empty description={labels.noData} />
      </div>
    );
  } else if (c.body === "mobile") {
    bodyRegion = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={props.rowActions}
        confirm={confirm}
        getRowId={getRowId}
        prefetch={props.prefetch}
        tableLabel={props.tableLabel}
      />
    );
  } else {
    bodyRegion = (
      <Table<TRow>
        aria-label={props.tableLabel}
        columns={columns}
        dataSource={source.rows}
        rowKey={getRowId}
        size={size}
        bordered={bordered}
        rowSelection={rowSelection}
        pagination={pagination}
        onChange={handleChange}
        onRow={
          props.prefetch
            ? (record) => ({ onMouseEnter: () => props.prefetch?.(record) })
            : undefined
        }
        scroll={{ x: "max-content" }}
        locale={{ emptyText: labels.noData }}
      />
    );
  }

  return (
    <div dir={props.dir} className={className}>
      <Space direction="vertical" size="small" style={{ width: "100%" }}>
        <Toolbar
          table={table}
          hideSearch={props.hideSearch}
          searchPlaceholder={props.searchPlaceholder}
          sortByOptions={props.sortByOptions}
          customToolbar={props.toolbar}
          hasFilters={Boolean(props.filters)}
          activeFilterCount={c.activeFilterCount}
          onOpenFilters={() => setDrawerOpen(true)}
          showRowsPerPage={!c.isPaged}
        />
        <Chips
          chips={c.mergedChips}
          onClearAll={props.onClearFilters}
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
      {props.filters && (
        <FilterDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          filters={props.filters}
          activeFilterCount={c.activeFilterCount}
          onClearFilters={props.onClearFilters}
          labels={labels}
        />
      )}
    </div>
  );
}
