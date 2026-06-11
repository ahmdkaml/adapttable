import {
  useChromeBodyData,
  useChromeScrollReset,
  useTableChrome,
} from "@adapttable/core";
import { Box, Button, Group, Paper, Progress, Stack } from "@mantine/core";
import { useDisclosure, useElementSize } from "@mantine/hooks";
import { useRef } from "react";

import { useMountStagger } from "./animation/useMountStagger";
import { ActiveFilterChips } from "./components/ActiveFilterChips";
import { BulkActionBar } from "./components/BulkActionBar";
import { ColumnMenu, type ColumnMenuProps } from "./components/ColumnMenu";
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

/** The Columns menu, rendered inline in the toolbar — or nothing when off. */
function ColumnMenuSlot<TRow>({
  enabled,
  ...props
}: Readonly<{ enabled: boolean } & ColumnMenuProps<TRow>>) {
  if (!enabled) return null;
  return <ColumnMenu {...props} />;
}

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
    rowActions,
    searchPlaceholder,
    sortByOptions,
    dir,
    prefetch,
    hideSearch,
    filters,
    filtersMode = "popover",
    bulkActions,
    slots,
    classNames,
    toolbar: customToolbar,
    skeletonRows,
    stickyTop = 0,
    animate = false,
    stickyHeader = false,
    enableColumnMenu = false,
  } = props;
  const density = props.density ?? "comfortable";

  const chrome = useTableChrome<TRow>(props);
  const { table, isMobile, confirm, getRowId } = chrome;
  const { virtualization, loadMoreRef, canLoadMore } = useChromeBodyData(
    chrome,
    props
  );
  const [drawerOpened, drawer] = useDisclosure(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const { ref: toolbarRef, height: toolbarHeight } = useElementSize();

  const desktopBodyRef = useRef<HTMLTableSectionElement>(null);
  const mobileBodyRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, chrome, props);

  useMountStagger(
    isMobile ? mobileBodyRef : desktopBodyRef,
    [virtualization.rows.length, isMobile],
    { enabled: animate }
  );

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
    // "noResults" means an active search/filter matched nothing — say so and
    // offer a working clear, instead of the misleading "no data".
    body =
      slots?.empty ??
      (chrome.emptyVariant === "noResults" ? (
        <EmptyState
          title={table.labels.noResults}
          action={
            <Button variant="light" size="sm" onClick={chrome.clearFilters}>
              {table.labels.clearAll}
            </Button>
          }
        />
      ) : (
        <EmptyState title={table.labels.noData} />
      ));
  } else if (chrome.body === "mobile") {
    body = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        getRowId={getRowId}
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
        bodyRef={mobileBodyRef}
        className={classNames?.card}
        rowEntries={virtualization.enabled ? virtualization.rows : undefined}
        paddingTop={virtualization.paddingTop}
        paddingBottom={virtualization.paddingBottom}
        measureElement={virtualization.measureElement}
        density={density}
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
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
        getRowId={getRowId}
        bodyRef={desktopBodyRef}
        className={classNames?.table}
        rowEntries={virtualization.enabled ? virtualization.rows : undefined}
        paddingTop={virtualization.paddingTop}
        paddingBottom={virtualization.paddingBottom}
        measureElement={virtualization.measureElement}
        stickyHeaderOffset={stickyTop + toolbarHeight}
        stickyHeader={stickyHeader}
        pinOffset={chrome.columnLayout.pinOffset}
        maxHeight={props.maxHeight}
        setWidth={
          props.resizableColumns ? chrome.columnLayout.setWidth : undefined
        }
        columnWidths={chrome.columnLayout.state.widths}
        resizeLabel={table.labels.resizeColumn}
        density={density}
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
      aria-busy={chrome.isRefreshing || undefined}
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
              filtersMode={filtersMode}
              filters={filters}
              filtersOpen={drawerOpened}
              onToggleFilters={drawer.toggle}
              onCloseFilters={drawer.close}
              onClearFilters={chrome.clearFilters}
              dir={dir}
              columnMenu={
                <ColumnMenuSlot
                  enabled={enableColumnMenu && !isMobile}
                  allColumns={chrome.allColumns}
                  layout={chrome.columnLayout}
                  labels={table.labels}
                />
              }
              showRowsPerPage={!chrome.isPaged}
            />
            <ActiveFilterChips
              chips={chrome.mergedChips}
              onClearAll={chrome.clearFilters}
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

        {chrome.isRefreshing && (
          <Progress
            size="xs"
            animated
            value={100}
            aria-label={table.labels.loading}
          />
        )}

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

        {canLoadMore && source.hasNextPage && (
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

      {filters && filtersMode === "drawer" && (
        <FilterDrawer
          opened={drawerOpened}
          onClose={drawer.close}
          filters={filters}
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={chrome.clearFilters}
          labels={table.labels}
          dir={dir}
        />
      )}
    </Paper>
  );
}
