import {
  type ActiveFilterChip,
  defaultConfirm,
  mergeFilterChips,
  resolveActiveFilterCount,
  useDataTable,
  useInfiniteScroll,
  useIsMobile,
} from "@adapttable/core";
import { Box, Button, Group, Paper, Stack } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useMemo, useRef } from "react";

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

const stickyToolbarStyle = {
  position: "sticky" as const,
  top: 0,
  zIndex: 3,
  background: "var(--mantine-color-body)",
  paddingBottom: "var(--mantine-spacing-xs)",
};

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
    columns,
    rowKey,
    rowActions,
    tableLabel,
    searchPlaceholder,
    sortByOptions,
    labels,
    dir,
    isMobile: isMobileProp,
    prefetch,
    hideSearch,
    filters,
    filterLabels,
    extraChips,
    activeFilterCount: activeFilterCountProp,
    onClearFilters,
    bulkActions,
    selectionGetId,
    slots,
    classNames,
    toolbar: customToolbar,
    confirm: confirmProp,
    skeletonRows,
    animate = false,
  } = props;

  const autoMobile = useIsMobile();
  const isMobile = isMobileProp ?? autoMobile;
  const confirm = confirmProp ?? defaultConfirm;

  const table = useDataTable<TRow>({
    source,
    columns,
    rowKey,
    tableLabel,
    labels,
    dir,
    isMobile,
    bulkActions,
    selectionGetId,
    filterLabels,
  });

  const [drawerOpened, drawer] = useDisclosure(false);
  const getRowId = selectionGetId ?? rowKey;

  const mergedChips = useMemo<readonly ActiveFilterChip[]>(
    () => mergeFilterChips(table.filterChips, extraChips),
    [table.filterChips, extraChips]
  );

  const activeFilterCount = resolveActiveFilterCount(
    activeFilterCountProp,
    mergedChips.length
  );

  const desktopBodyRef = useRef<HTMLTableSectionElement>(null);
  const mobileBodyRef = useRef<HTMLDivElement>(null);
  useMountStagger(
    isMobile ? mobileBodyRef : desktopBodyRef,
    [source.rows, isMobile],
    {
      enabled: animate,
    }
  );

  const isPaged = source.paginationMode === "paged";
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: () => source.fetchNextPage(),
    itemCount: source.rows.length,
    enabled: !isPaged && !source.error,
  });
  const showFooter =
    isPaged &&
    !source.error &&
    (source.total > 0 || source.isLoading || source.isFetching);

  let body: React.ReactNode;
  if (source.isLoading && source.rows.length === 0) {
    body = slots?.skeleton ?? (
      <TableSkeleton
        columns={table.columns.length || 1}
        rows={skeletonRows ?? source.limit}
      />
    );
  } else if (table.isEmpty) {
    body = slots?.empty ?? <EmptyState title={table.labels.noData} />;
  } else if (isMobile) {
    body = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        getRowId={getRowId}
        bodyRef={mobileBodyRef}
        className={classNames?.card}
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
      />
    );
  }

  return (
    <Paper p="xs" radius="md" withBorder dir={dir} className={classNames?.root}>
      <Stack gap="xs">
        <Box style={stickyToolbarStyle} className={classNames?.toolbar}>
          <Stack gap="xs">
            <Toolbar
              table={table}
              hideSearch={hideSearch}
              searchPlaceholder={searchPlaceholder}
              sortByOptions={sortByOptions}
              customToolbar={customToolbar}
              hasFilters={Boolean(filters)}
              activeFilterCount={activeFilterCount}
              onOpenFilters={drawer.open}
              showRowsPerPage={!isPaged}
            />
            <ActiveFilterChips
              chips={mergedChips}
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

        {!isPaged && !source.error && source.hasNextPage && (
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

        {showFooter && (
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
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
          labels={table.labels}
        />
      )}
    </Paper>
  );
}
