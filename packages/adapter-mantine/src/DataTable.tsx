import {
  DEFAULT_CARD_SIZE_PX,
  DEFAULT_ROW_SIZE_PX,
  useInfiniteScroll,
  useScrollToTableTop,
  useTableChrome,
  useTableVirtualization,
} from "@adapttable/core";
import { Box, Button, Group, Paper, Stack } from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { useCallback, useRef } from "react";

import { useMountStagger } from "./animation/useMountStagger";
import { ActiveFilterChips } from "./components/ActiveFilterChips";
import { BulkActionBar } from "./components/BulkActionBar";
import { DesktopTable } from "./components/DesktopTable";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { FilterDrawer } from "./components/FilterDrawer";
import { MobileCards } from "./components/MobileCards";
import { PaginationFooter } from "./components/PaginationFooter";
import { TableSkeleton } from "./components/TableSkeleton";
import { Toolbar } from "./components/Toolbar";
import type { DataTableProps } from "./types";

const stickyToolbarStyle = (top: number) => ({
  position: "sticky" as const,
  top,
  zIndex: 3,
  background: "var(--mantine-color-body)",
  paddingBottom: "var(--mantine-spacing-xs)",
});

/**
 * Batteries-included Mantine data table. Drop in `columns`, a `source`
 * (from `useFrontendData` / `useBackendData`), and a `rowKey` to get a
 * fully styled, sortable, filterable, paginated table with selection,
 * bulk actions, RTL, dark mode, and optional entrance animation.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const {
    source,
    rowKey,
    rowActions,
    searchPlaceholder,
    sortByOptions,
    dir,
    prefetch,
    hideSearch,
    filters,
    onClearFilters,
    bulkActions,
    slots,
    classNames,
    toolbar: customToolbar,
    skeletonRows,
    virtualize = false,
    estimateRowSize,
    estimateCardSize,
    virtualOverscan,
    virtualScrollMargin,
    stickyTop = 0,
    scrollToTopOnChange = true,
    scrollTopGap,
    animate = false,
    stickyHeader = true,
  } = props;

  const chrome = useTableChrome<TRow>(props);
  const { table, isMobile, confirm, getRowId } = chrome;
  const [drawerOpened, drawer] = useDisclosure(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { ref: toolbarRef, height: toolbarHeight } = useElementSize();

  const handleVirtualEndReached = useCallback(() => {
    if (source.hasNextPage && !source.isFetchingNextPage) {
      source.fetchNextPage();
    }
  }, [source]);

  const desktopBodyRef = useRef<HTMLTableSectionElement>(null);
  const mobileBodyRef = useRef<HTMLDivElement>(null);
  const virtualization = useTableVirtualization({
    rows: source.rows,
    rowKey,
    enabled:
      virtualize &&
      !chrome.isPaged &&
      !source.error &&
      (chrome.body === "desktop" || chrome.body === "mobile"),
    estimateSize: isMobile
      ? (estimateCardSize ?? DEFAULT_CARD_SIZE_PX)
      : (estimateRowSize ?? DEFAULT_ROW_SIZE_PX),
    overscan: virtualOverscan,
    scrollMargin: virtualScrollMargin,
    onEndReached: handleVirtualEndReached,
  });
  useScrollToTableTop({
    ref: rootRef,
    deps: [
      source.search,
      source.sortBy ?? "",
      source.sortDir ?? "",
      source.page,
      chrome.activeFilterCount,
    ],
    enabled: scrollToTopOnChange,
    offset: stickyTop,
    gap: scrollTopGap,
  });

  useMountStagger(
    isMobile ? mobileBodyRef : desktopBodyRef,
    [virtualization.rows.length, isMobile],
    { enabled: animate }
  );

  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: () => source.fetchNextPage(),
    itemCount: source.rows.length,
    enabled: !chrome.isPaged && !source.error,
  });

  let body: React.ReactNode;
  if (chrome.body === "skeleton") {
    body = slots?.skeleton ?? (
      <TableSkeleton
        columns={table.columns.length || 1}
        rows={skeletonRows ?? source.limit}
        loadingLabel={table.labels.loading}
      />
    );
  } else if (chrome.body === "empty") {
    body = slots?.empty ?? <EmptyState title={table.labels.noData} />;
  } else if (chrome.body === "mobile") {
    body = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        getRowId={getRowId}
        bodyRef={mobileBodyRef}
        className={classNames?.card}
        rowEntries={virtualization.enabled ? virtualization.rows : undefined}
        paddingTop={virtualization.paddingTop}
        paddingBottom={virtualization.paddingBottom}
        measureElement={virtualization.measureElement}
      />
    );
  } else {
    body = (
      <DesktopTable
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        prefetch={prefetch}
        getRowId={getRowId}
        bodyRef={desktopBodyRef}
        className={classNames?.table}
        rowEntries={virtualization.enabled ? virtualization.rows : undefined}
        paddingTop={virtualization.paddingTop}
        paddingBottom={virtualization.paddingBottom}
        measureElement={virtualization.measureElement}
        stickyHeaderOffset={stickyTop + toolbarHeight}
        stickyHeader={stickyHeader}
      />
    );
  }

  return (
    <Paper
      ref={rootRef}
      p="xs"
      radius="md"
      withBorder
      dir={dir}
      className={classNames?.root}
    >
      <Stack gap="xs">
        <Box
          ref={toolbarRef}
          style={stickyToolbarStyle(stickyTop)}
          className={classNames?.toolbar}
        >
          <Stack gap="xs">
            <Toolbar
              table={table}
              hideSearch={hideSearch}
              searchPlaceholder={searchPlaceholder}
              sortByOptions={sortByOptions}
              customToolbar={customToolbar}
              hasFilters={Boolean(filters)}
              activeFilterCount={chrome.activeFilterCount}
              onOpenFilters={drawer.open}
              showRowsPerPage={!chrome.isPaged}
            />
            <ActiveFilterChips
              chips={chrome.mergedChips}
              onClearAll={onClearFilters}
              label={table.labels.filters}
              clearAllLabel={table.labels.clearAll}
            />
            {table.selection && bulkActions && (
              <BulkActionBar
                selection={table.selection}
                bulkActions={bulkActions}
                confirm={confirm}
                labels={table.labels}
              />
            )}
          </Stack>
        </Box>

        {source.error && (
          <ErrorState
            error={source.error}
            title={table.labels.errorTitle}
            message={table.labels.errorMessage}
            retryLabel={table.labels.retry}
            onRetry={source.refetch ? () => void source.refetch?.() : undefined}
            isRetrying={source.isFetching}
          />
        )}

        {!source.error && body}

        {!chrome.isPaged && !source.error && source.hasNextPage && (
          <Group ref={loadMoreRef} justify="center" py="xs">
            <Button
              variant="default"
              size="sm"
              loading={source.isFetchingNextPage}
              onClick={() => source.fetchNextPage()}
            >
              {table.labels.loadMore}
            </Button>
          </Group>
        )}

        {chrome.showFooter && (
          <Box className={classNames?.footer}>
            <PaginationFooter
              page={table.pagination.safePage}
              totalPages={table.pagination.totalPages}
              limit={source.limit}
              total={source.total}
              fromIndex={table.pagination.fromIndex}
              toIndex={table.pagination.toIndex}
              onPageChange={source.setPage}
              onLimitChange={source.setLimit}
              labels={table.labels}
            />
          </Box>
        )}
      </Stack>

      {filters && (
        <FilterDrawer
          opened={drawerOpened}
          onClose={drawer.close}
          filters={filters}
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={onClearFilters}
          labels={table.labels}
          dir={dir}
        />
      )}
    </Paper>
  );
}
