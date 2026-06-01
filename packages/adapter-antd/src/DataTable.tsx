import {
  pageSizeOptions,
  useInfiniteScroll,
  useTableChrome,
} from "@adapttable/core";
import { Button, Checkbox, Flex, Space, Table, type TableProps } from "antd";
import { useState } from "react";

import { buildColumns } from "./columns";
import {
  BulkBar,
  Chips,
  ErrorState,
  FilterDrawer,
  Toolbar,
} from "./components/chrome";
import type { DataTableProps } from "./types";

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

  const showCustomSkeleton = c.body === "skeleton" && Boolean(slots?.skeleton);

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
        {source.error && (
          <ErrorState
            error={source.error}
            labels={labels}
            onRetry={source.refetch ? () => void source.refetch?.() : undefined}
          />
        )}
        {!source.error && showCustomSkeleton && slots?.skeleton}
        {!source.error && !showCustomSkeleton && (
          <Table<TRow>
            aria-label={props.tableLabel}
            columns={columns}
            dataSource={source.rows}
            rowKey={getRowId}
            size={size}
            bordered={bordered}
            loading={c.body === "skeleton"}
            rowSelection={rowSelection}
            pagination={pagination}
            onChange={handleChange}
            onRow={
              props.prefetch
                ? (record) => ({
                    onMouseEnter: () => props.prefetch?.(record),
                  })
                : undefined
            }
            scroll={{ x: "max-content" }}
            locale={{ emptyText: slots?.empty ?? labels.noData }}
          />
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
