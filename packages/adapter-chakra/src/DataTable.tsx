import {
  type TableBody,
  useChromeBodyData,
  useChromeScrollReset,
  useTableChrome,
} from "@adapttable/core";
import { Box, Button, Flex, Progress, Stack, Text } from "@chakra-ui/react";
import { type ReactNode, useRef, useState } from "react";

import {
  BulkBar,
  Chips,
  ErrorState,
  FilterDrawer,
  Footer,
  LoadingState,
  Toolbar,
} from "./components/chrome";
import { ColumnMenu } from "./components/ColumnMenu";
import { DesktopTable, MobileCards } from "./components/tables";
import { subtleText } from "./styles";
import type { DataTableProps } from "./types";

/**
 * Batteries-included Chakra UI data table. Drop in `columns`, a `source`,
 * and a `rowKey` for a fully styled, sortable, filterable, paginated Chakra
 * table with selection, bulk actions, RTL, and dark mode — on the headless
 * `@adapttable/core` engine.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const { slots, colorScheme } = props;
  const { filtersMode = "popover" } = props;
  // Map row density to Chakra's table `size` (independent of column pinning):
  // compact → "sm", comfortable (default) → "md". An explicit `size` prop, if
  // given, still wins for backward compatibility.
  const size =
    props.size ??
    ((props.density ?? "comfortable") === "compact" ? "sm" : "md");
  const chrome = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = chrome;
  const { labels, source } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, chrome, props);
  const { virtualization, loadMoreRef, canLoadMore } = useChromeBodyData(
    chrome,
    props
  );

  const tableProps = {
    table,
    rows: source.rows,
    rowActions: props.rowActions,
    confirm,
    getRowId,
    size,
    colorScheme,
    rowEntries: virtualization.enabled ? virtualization.rows : undefined,
    paddingTop: virtualization.paddingTop,
    paddingBottom: virtualization.paddingBottom,
    measureElement: virtualization.measureElement,
    stickyHeader: props.stickyHeader,
    stickyTop: props.stickyTop,
    pinOffset: chrome.columnLayout.pinOffset,
    maxHeight: props.maxHeight,
    setWidth: props.resizableColumns ? chrome.columnLayout.setWidth : undefined,
    columnWidths: chrome.columnLayout.state.widths,
    resizeLabel: table.labels.resizeColumn,
    onRowClick: props.onRowClick,
    rowClassName: props.rowClassName,
  };
  const bodyByRegion: Record<TableBody, ReactNode> = {
    skeleton: slots?.skeleton ?? (
      <LoadingState
        rows={props.skeletonRows ?? source.limit}
        columns={table.columns.length}
        loadingLabel={labels.loading}
      />
    ),
    empty:
      slots?.empty ??
      (chrome.emptyVariant === "noResults" ? (
        <Stack role="status" align="center" py={10} spacing={3}>
          <Text {...subtleText}>{labels.noResults}</Text>
          <Button
            size="sm"
            variant="outline"
            colorScheme={colorScheme}
            onClick={chrome.clearFilters}
          >
            {labels.clearAll}
          </Button>
        </Stack>
      ) : (
        <Text role="status" {...subtleText} textAlign="center" py={10}>
          {labels.noData}
        </Text>
      )),
    mobile: <MobileCards {...tableProps} className={props.classNames?.card} />,
    desktop: (
      <DesktopTable
        {...tableProps}
        prefetch={props.prefetch}
        className={props.classNames?.table}
      />
    ),
  };

  return (
    <Box
      ref={rootRef}
      dir={props.dir}
      className={props.classNames?.root}
      aria-busy={chrome.isRefreshing || undefined}
      borderWidth="1px"
      borderRadius="md"
      p={3}
    >
      <Stack spacing={3}>
        <Toolbar
          className={props.classNames?.toolbar}
          table={table}
          hideSearch={props.hideSearch}
          searchPlaceholder={props.searchPlaceholder}
          sortByOptions={props.sortByOptions}
          customToolbar={props.toolbar}
          hasFilters={Boolean(props.filters)}
          activeFilterCount={chrome.activeFilterCount}
          filtersMode={filtersMode}
          filters={props.filters}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((o) => !o)}
          onCloseFilters={() => setFiltersOpen(false)}
          onClearFilters={chrome.clearFilters}
          columnMenu={
            props.enableColumnMenu && !chrome.isMobile ? (
              <ColumnMenu
                allColumns={chrome.allColumns}
                layout={chrome.columnLayout}
                labels={table.labels}
              />
            ) : undefined
          }
          showRowsPerPage={!chrome.isPaged}
          colorScheme={colorScheme}
          dir={props.dir}
        />
        {chrome.isRefreshing && (
          <Progress size="xs" isIndeterminate aria-label={labels.loading} />
        )}
        <Chips
          chips={chrome.mergedChips}
          onClearAll={chrome.clearFilters}
          labels={labels}
        />
        {table.selection && props.bulkActions && (
          <BulkBar
            selection={table.selection}
            bulkActions={props.bulkActions}
            confirm={confirm}
            labels={labels}
            colorScheme={colorScheme}
          />
        )}
        {source.error ? (
          <ErrorState
            error={source.error}
            labels={labels}
            onRetry={source.refetch ? () => void source.refetch?.() : undefined}
          />
        ) : (
          bodyByRegion[chrome.body]
        )}
        {canLoadMore && source.hasNextPage && (
          <Flex ref={loadMoreRef} justify="center" py={2}>
            <Button
              size="sm"
              variant="outline"
              isLoading={source.isFetchingNextPage}
              onClick={() => source.fetchNextPage()}
            >
              {labels.loadMore}
            </Button>
          </Flex>
        )}
        {chrome.showFooter && (
          <Footer
            className={props.classNames?.footer}
            pagination={table.pagination}
            total={source.total}
            limit={source.limit}
            setPage={source.setPage}
            setLimit={source.setLimit}
            labels={labels}
          />
        )}
      </Stack>
      {props.filters && filtersMode === "drawer" && (
        <FilterDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={props.filters}
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={chrome.clearFilters}
          labels={labels}
          colorScheme={colorScheme}
          dir={props.dir}
        />
      )}
    </Box>
  );
}
