import { resolveLabels } from "@adapttable/core";
import {
  FindBar,
  GridFocusAnnouncer,
  SelectionStatsBar,
  useDataTableShell,
  useMountStagger,
} from "@adapttable/core/adapter";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import { Chips } from "./components/ActiveFilterChips";
import { AutoFilterForm } from "./components/AutoFilterForm";
import { BulkBar } from "./components/BulkActionBar";
import { ColumnMenu } from "./components/ColumnMenu";
import { DesktopTable } from "./components/DesktopTable";
import { ErrorState } from "./components/ErrorState";
import { FilterDrawer } from "./components/FilterDrawer";
import { MobileCards } from "./components/MobileCards";
import { Footer } from "./components/PaginationFooter";
import { SavedViewsMenu } from "./components/SavedViewsMenu";
import { LoadingState } from "./components/TableSkeleton";
import { Toolbar } from "./components/Toolbar";
import type { DataTableProps } from "./types";

/**
 * Map row density to MUI's table `size`, independent of column pinning. An
 * explicit `size` prop still wins for backward compatibility.
 */
function tableSize(
  size: "small" | "medium" | undefined,
  density: "comfortable" | "compact" | undefined
): "small" | "medium" {
  if (size) return size;
  return density === "compact" ? "small" : "medium";
}

/**
 * Batteries-included Material UI data table. Drop in `columns`, `data` (or
 * `data` + `onQueryChange` for server fetching, or a full `source`), and a
 * `rowKey` for a fully styled, sortable, filterable, paginated MUI table
 * with selection, bulk actions, RTL, and dark mode — a free DataGrid-style
 * experience on the headless `@adapttable/core` engine. Declarative
 * `filters` (and column `filter` shorthands) render an auto-built form.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const { slots, className, classNames, animate = false } = props;
  const size = tableSize(props.size, props.density);
  const { filtersMode = "popover" } = props;
  // The whole shared orchestration lives in core's shell; MUI adds only its
  // kit's row `size` over the returned bundles.
  const shell = useDataTableShell<TRow>(props, (defs, source) => (
    <AutoFilterForm
      defs={defs}
      source={source}
      labels={resolveLabels(props.labels)}
    />
  ));
  const {
    chrome: c,
    table,
    labels,
    filtersNode,
    filtersOpen,
    setFiltersOpen,
    filtersTrigger,
    rootRef,
    loadMoreRef,
    canLoadMore,
    hasRowActions,
    toolbarProps,
  } = shell;
  // Everything rendered below reads the chrome's VIEW facade — identical to
  // the raw source except under grouping, where it presents the full set.
  const viewSource = shell.source;
  const { confirm } = c;
  const tableProps = { ...shell.tableProps, size };
  useMountStagger(rootRef, [viewSource.rows.length, c.isMobile], {
    enabled: animate,
  });
  const columnMenu = props.enableColumnMenu && !c.isMobile && (
    <ColumnMenu
      allColumns={c.allColumns}
      layout={c.columnLayout}
      labels={labels}
      hasRowActions={hasRowActions}
      dir={props.dir}
    />
  );
  // Saved views capture the table's own URL params, so the menu defaults to
  // the table's URL backend + namespace (an explicit option still wins).
  const savedViewsMenu = props.savedViews && (
    <SavedViewsMenu
      options={{
        urlAdapter: shell.urlAdapter,
        urlKey: props.urlKey,
        ...props.savedViews,
      }}
      labels={labels}
    />
  );

  let body: React.ReactNode;
  if (c.body === "skeleton") {
    body = slots?.skeleton ?? (
      <LoadingState
        rows={props.skeletonRows ?? viewSource.limit}
        columns={table.columns.length}
        loadingLabel={labels.loading}
      />
    );
  } else if (c.body === "empty") {
    body = (c.emptyVariant === "noResults" ? slots?.noResults : undefined) ??
      slots?.empty ?? (
        <Stack role="status" spacing={1.5} sx={{ py: 6, alignItems: "center" }}>
          <Typography color="text.secondary" align="center">
            {c.emptyVariant === "noResults" ? labels.noResults : labels.noData}
          </Typography>
          {c.emptyVariant === "noResults" && (
            <Button variant="outlined" size="small" onClick={c.clearFilters}>
              {labels.clearAll}
            </Button>
          )}
        </Stack>
      );
  } else if (c.body === "mobile") {
    body = <MobileCards {...tableProps} cardClassName={classNames?.card} />;
  } else {
    body = (
      <Box className={classNames?.table}>
        <DesktopTable {...tableProps} prefetch={props.prefetch} />
      </Box>
    );
  }

  return (
    <Paper
      ref={rootRef}
      variant="outlined"
      dir={props.dir}
      className={
        [className, classNames?.root].filter(Boolean).join(" ") || undefined
      }
      aria-busy={c.isRefreshing || undefined}
      sx={{ p: 1.5 }}
    >
      <GridFocusAnnouncer focus={shell.gridFocus} />
      <FindBar find={shell.find} labels={labels} />
      <Stack spacing={1.5}>
        <Box className={classNames?.toolbar}>
          <Toolbar
            {...toolbarProps}
            savedViewsMenu={savedViewsMenu}
            filtersMode={filtersMode}
            filtersOpen={filtersOpen}
            onToggleFilters={filtersTrigger.onClick}
            onFiltersTriggerPointerDown={filtersTrigger.onPointerDown}
            onCloseFilters={() => setFiltersOpen(false)}
            columnMenu={columnMenu}
          />
        </Box>
        {c.isRefreshing && <LinearProgress aria-label={labels.loading} />}
        <Chips
          chips={c.mergedChips}
          onClearAll={c.clearFilters}
          labels={labels}
        />
        {table.selection && props.bulkActions && (
          <BulkBar
            selection={table.selection}
            total={viewSource.total}
            bulkActions={props.bulkActions}
            confirm={confirm}
            labels={labels}
          />
        )}
        {viewSource.error ? (
          <ErrorState
            error={viewSource.error}
            labels={labels}
            onRetry={
              viewSource.refetch ? () => void viewSource.refetch?.() : undefined
            }
          />
        ) : (
          body
        )}
        {canLoadMore && viewSource.hasNextPage && (
          <Box
            ref={loadMoreRef}
            sx={{ display: "flex", justifyContent: "center", py: 1 }}
          >
            <Button
              variant="outlined"
              size="small"
              disabled={viewSource.isFetchingNextPage}
              onClick={() => viewSource.fetchNextPage()}
            >
              {labels.loadMore}
            </Button>
          </Box>
        )}
        {c.showFooter && (
          <Box className={classNames?.footer}>
            <Footer
              pagination={table.pagination}
              total={viewSource.total}
              limit={viewSource.limit}
              setPage={viewSource.setPage}
              setLimit={viewSource.setLimit}
              labels={labels}
              showRowsPerPage={!c.grouping}
            />
          </Box>
        )}
      </Stack>
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
      <SelectionStatsBar
        stats={shell.selectionStats}
        labels={labels}
        locale={props.locale}
      />
    </Paper>
  );
}
