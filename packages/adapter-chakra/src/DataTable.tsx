import {
  DEFAULT_CARD_SIZE_PX,
  DEFAULT_ROW_SIZE_PX,
  type TableBody,
  useInfiniteScroll,
  useScrollToTableTop,
  useTableChrome,
  useTableVirtualization,
  warnVirtualizeInScrollBox,
} from "@adapttable/core";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { type ReactNode, useCallback, useRef, useState } from "react";

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
  const {
    slots,
    colorScheme,
    virtualize = false,
    estimateRowSize,
    estimateCardSize,
    virtualOverscan,
    virtualScrollMargin,
  } = props;
  const { filtersMode = "popover" } = props;
  // Map row density to Chakra's table `size` (independent of column pinning):
  // compact → "sm", comfortable (default) → "md". An explicit `size` prop, if
  // given, still wins for backward compatibility.
  const size =
    props.size ??
    ((props.density ?? "comfortable") === "compact" ? "sm" : "md");
  warnVirtualizeInScrollBox(props.virtualize ?? false, props.maxHeight);
  const chrome = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = chrome;
  const { labels, source } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useScrollToTableTop({
    ref: rootRef,
    deps: [
      source.search,
      source.sortBy ?? "",
      source.sortDir ?? "",
      source.page,
      chrome.activeFilterCount,
    ],
    enabled: props.scrollToTopOnChange,
    offset: props.stickyTop,
    gap: props.scrollTopGap,
  });
  const handleVirtualEndReached = useCallback(() => {
    if (source.hasNextPage && !source.isFetchingNextPage) {
      source.fetchNextPage();
    }
  }, [source]);
  const virtualization = useTableVirtualization({
    rows: source.rows,
    rowKey: props.rowKey,
    enabled:
      virtualize &&
      !chrome.isPaged &&
      !source.error &&
      (chrome.body === "desktop" || chrome.body === "mobile"),
    estimateSize: chrome.isMobile
      ? (estimateCardSize ?? DEFAULT_CARD_SIZE_PX)
      : (estimateRowSize ?? DEFAULT_ROW_SIZE_PX),
    overscan: virtualOverscan,
    scrollMargin: virtualScrollMargin,
    onEndReached: handleVirtualEndReached,
  });
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: () => source.fetchNextPage(),
    itemCount: source.rows.length,
    enabled: !chrome.isPaged && !source.error,
  });

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
  };
  const bodyByRegion: Record<TableBody, ReactNode> = {
    skeleton: slots?.skeleton ?? (
      <LoadingState
        rows={props.skeletonRows ?? source.limit}
        columns={table.columns.length}
        loadingLabel={labels.loading}
      />
    ),
    empty: slots?.empty ?? (
      <Text role="status" {...subtleText} textAlign="center" py={10}>
        {labels.noData}
      </Text>
    ),
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
          onClearFilters={props.onClearFilters}
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
        <Chips
          chips={chrome.mergedChips}
          onClearAll={props.onClearFilters}
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
        {!chrome.isPaged && !source.error && source.hasNextPage && (
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
          onClearFilters={props.onClearFilters}
          labels={labels}
          colorScheme={colorScheme}
          dir={props.dir}
        />
      )}
    </Box>
  );
}
