import {
  resolveLabels,
  type TableLabels,
  type UseSavedViewsOptions,
} from "@adapttable/core";
import {
  BatchEditBar,
  FindBar,
  GridFocusAnnouncer,
  RowReorderAnnouncer,
  SelectionStatsBar,
  useDataTableShell,
} from "@adapttable/core/adapter";
import { Box, Button, Group, Paper, Progress, Stack } from "@mantine/core";
import { useElementSize } from "@mantine/hooks";
import { useRef } from "react";

import { useMountStagger } from "./animation/useMountStagger";
import { ActiveFilterChips } from "./components/ActiveFilterChips";
import { AutoFilterForm } from "./components/AutoFilterForm";
import { BulkActionBar } from "./components/BulkActionBar";
import { ColumnMenu, type ColumnMenuProps } from "./components/ColumnMenu";
import { DesktopTable } from "./components/DesktopTable";
import { EmptyState } from "./components/EmptyState";
import { ErrorState } from "./components/ErrorState";
import { FilterDrawer } from "./components/FilterDrawer";
import { MobileCards } from "./components/MobileCards";
import { PaginationFooter } from "./components/PaginationFooter";
import { SavedViewsMenu } from "./components/SavedViewsMenu";
import { TableSkeleton } from "./components/TableSkeleton";
import { Toolbar } from "./components/Toolbar";
import { SURFACE } from "./surface";
import type { DataTableProps } from "./types";

const stickyToolbarStyle = (top: number) => ({
  position: "sticky" as const,
  top,
  zIndex: 3,
  background: SURFACE,
  paddingBottom: "var(--mantine-spacing-xs)",
});

/** The toolbar's style: parked sticky at `stickyTop` only when asked to. */
const toolbarStyle = (stickyToolbar: boolean, stickyTop: number) =>
  stickyToolbar ? stickyToolbarStyle(stickyTop) : undefined;

/**
 * The sticky header's inset: below the sticky toolbar when it sticks,
 * otherwise the caller's inset alone — the cross-adapter meaning.
 */
const stickyHeaderInset = (
  stickyToolbar: boolean,
  stickyTop: number,
  toolbarHeight: number
) => (stickyToolbar ? stickyTop + toolbarHeight : stickyTop);

/** The Columns menu, rendered inline in the toolbar — or nothing when off. */
function ColumnMenuSlot<TRow>({
  enabled,
  ...props
}: Readonly<{ enabled: boolean } & ColumnMenuProps<TRow>>) {
  if (!enabled) return null;
  return <ColumnMenu {...props} />;
}

/**
 * The Saved-views menu in the toolbar. A component (not inline JSX) so
 * `useSavedViews` only runs when the `savedViews` prop is set.
 */
function SavedViewsSlot({
  options,
  labels,
}: Readonly<{ options: UseSavedViewsOptions; labels: Required<TableLabels> }>) {
  return <SavedViewsMenu options={options} labels={labels} />;
}

/**
 * Batteries-included Mantine data table. Drop in `columns`, a `rowKey`,
 * and a data tier — raw `data` (frontend), `data` + `onQueryChange`
 * (server), or a prebuilt `source` — to get a fully styled, sortable,
 * filterable, paginated table with selection, bulk actions, RTL, dark
 * mode, and optional entrance animation.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const {
    dir,
    prefetch,
    filtersMode = "popover",
    bulkActions,
    slots,
    classNames,
    skeletonRows,
    stickyTop = 0,
    stickyToolbar = false,
    animate = false,
    stickyHeader = false,
    enableColumnMenu = false,
    savedViews,
  } = props;
  const density = props.density ?? "comfortable";

  // The whole shared orchestration — data tier, filter runtime, chrome,
  // scroll reset, body windowing — lives in core. Mantine adds only what its
  // kit needs: a measured sticky toolbar, per-body stagger refs, and density.
  const shell = useDataTableShell<TRow>(props, (defs, source) => (
    <AutoFilterForm
      defs={defs}
      source={source}
      labels={resolveLabels(props.labels)}
    />
  ));
  const {
    chrome,
    table,
    filtersNode: filters,
    filtersOpen: drawerOpened,
    setFiltersOpen: setDrawerOpened,
    filtersTrigger,
    rootRef,
    loadMoreRef,
    canLoadMore,
    hasRowActions,
    hasRowReorder,
    toolbarProps,
  } = shell;
  // Everything rendered below reads the chrome's VIEW facade — identical to
  // the raw source except under grouping, where it presents the full set.
  const viewSource = shell.source;
  const { isMobile, confirm } = chrome;
  const { ref: toolbarRef, height: toolbarHeight } = useElementSize();

  const desktopBodyRef = useRef<HTMLTableSectionElement>(null);
  const mobileBodyRef = useRef<HTMLDivElement>(null);

  useMountStagger(
    isMobile ? mobileBodyRef : desktopBodyRef,
    [shell.tableProps.rows.length, isMobile],
    { enabled: animate }
  );

  // Kit-agnostic render bundle + Mantine's own extras.
  const tableProps = { ...shell.tableProps, density };

  let body: React.ReactNode;
  if (chrome.body === "skeleton") {
    body = slots?.skeleton ?? (
      <TableSkeleton
        columns={table.columns.length || 1}
        rows={skeletonRows ?? viewSource.limit}
        loadingLabel={table.labels.loading}
      />
    );
  } else if (chrome.body === "empty") {
    // "noResults" means an active search/filter matched nothing — say so and
    // offer a working clear, instead of the misleading "no data".
    body =
      (chrome.emptyVariant === "noResults" ? slots?.noResults : undefined) ??
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
        {...tableProps}
        bodyRef={mobileBodyRef}
        className={classNames?.card}
      />
    );
  } else {
    body = (
      <DesktopTable
        {...tableProps}
        prefetch={prefetch}
        bodyRef={desktopBodyRef}
        className={classNames?.table}
        stickyHeader={stickyHeader}
        stickyHeaderOffset={stickyHeaderInset(
          stickyToolbar,
          stickyTop,
          toolbarHeight
        )}
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
      <GridFocusAnnouncer focus={shell.gridFocus} />
      {shell.tableProps.rowReorder ? (
        <RowReorderAnnouncer
          announcement={shell.tableProps.rowReorder.announcement}
        />
      ) : null}
      <FindBar find={shell.find} labels={table.labels} />
      <Stack gap="xs">
        <Box
          ref={toolbarRef}
          style={toolbarStyle(stickyToolbar, stickyTop)}
          className={classNames?.toolbar}
        >
          <Stack gap="xs">
            <Toolbar
              {...toolbarProps}
              filtersMode={filtersMode}
              filtersOpen={drawerOpened}
              onToggleFilters={filtersTrigger.onClick}
              onFiltersTriggerPointerDown={filtersTrigger.onPointerDown}
              onCloseFilters={() => setDrawerOpened(false)}
              savedViewsMenu={
                savedViews && (
                  <SavedViewsSlot
                    // The table's own URL backend/namespace are the
                    // defaults — an explicit option still wins.
                    options={{
                      urlAdapter: shell.urlAdapter,
                      urlKey: props.urlKey,
                      ...savedViews,
                    }}
                    labels={table.labels}
                  />
                )
              }
              columnMenu={
                <ColumnMenuSlot
                  enabled={enableColumnMenu && !isMobile}
                  onAutoSize={shell.autoSizeColumns}
                  onAutoSizeColumn={shell.autoSizeColumn}
                  onSortColumn={(key, dir) => viewSource.setSort(key, dir)}
                  onFilterColumn={() => setDrawerOpened(true)}
                  sortBy={viewSource.sortBy}
                  sortDir={viewSource.sortDir}
                  allColumns={chrome.allColumns}
                  layout={chrome.columnLayout}
                  labels={table.labels}
                  hasRowActions={hasRowActions}
                  hasRowReorder={hasRowReorder}
                  dir={dir}
                />
              }
            />
            <ActiveFilterChips
              chips={chrome.mergedChips}
              onClearAll={chrome.clearFilters}
              label={table.labels.filters}
              clearAllLabel={table.labels.clearAll}
            />
            {chrome.editing?.batch && (
              <BatchEditBar
                batch={chrome.editing.batch}
                labels={table.labels}
              />
            )}

            {table.selection && bulkActions && (
              <BulkActionBar
                selection={table.selection}
                total={viewSource.total}
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

        {viewSource.error && (
          <ErrorState
            error={viewSource.error}
            title={table.labels.errorTitle}
            message={table.labels.errorMessage}
            retryLabel={table.labels.retry}
            onRetry={
              viewSource.refetch ? () => void viewSource.refetch?.() : undefined
            }
            isRetrying={viewSource.isFetching}
          />
        )}

        {!viewSource.error && body}

        {canLoadMore && viewSource.hasNextPage && (
          <Group ref={loadMoreRef} justify="center" py="xs">
            <Button
              variant="default"
              size="sm"
              loading={viewSource.isFetchingNextPage}
              onClick={() => viewSource.fetchNextPage()}
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
              limit={viewSource.limit}
              total={viewSource.total}
              fromIndex={table.pagination.fromIndex}
              toIndex={table.pagination.toIndex}
              onPageChange={viewSource.setPage}
              onLimitChange={viewSource.setLimit}
              labels={table.labels}
              showRowsPerPage={!chrome.grouping}
            />
          </Box>
        )}
      </Stack>

      {filters && filtersMode === "drawer" && (
        <FilterDrawer
          opened={drawerOpened}
          onClose={() => setDrawerOpened(false)}
          filters={filters}
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={chrome.clearFilters}
          labels={table.labels}
          dir={dir}
        />
      )}
      <SelectionStatsBar
        stats={shell.selectionStats}
        labels={table.labels}
        locale={props.locale}
      />
    </Paper>
  );
}
