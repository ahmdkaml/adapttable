import {
  isDeclarativeFilters,
  useChromeBodyData,
  useChromeScrollReset,
  useFilterTriggerToggle,
  useTableChrome,
  useTableData,
} from "@adapttable/core";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useRef, useState } from "react";

import { AutoFilterForm } from "./components/AutoFilterForm";
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
import { SavedViewsMenu } from "./components/SavedViewsMenu";
import { DesktopTable, MobileCards } from "./components/tables";
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

/** The width setter only when column resize is enabled (opt-in). */
function resizeSetter(
  enabled: boolean | undefined,
  setWidth: (key: string, width: number) => void
): ((key: string, width: number) => void) | undefined {
  return enabled ? setWidth : undefined;
}

/**
 * Resolve the data tier (`source` > `data` + `onQueryChange` > `data`) and
 * the filter content, then overlay them on the caller's props: caller JSX
 * filters pass through; the declarative array becomes the auto-built
 * {@link AutoFilterForm} (or nothing, when no definitions resolved); the
 * runtime's chip-label resolvers merge under any caller overrides.
 */
function useChromeProps<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const { source, runtime } = useTableData<TRow>({
    locale: props.locale,
    source: props.source,
    data: props.data,
    total: props.total,
    loading: props.loading,
    onQueryChange: props.onQueryChange,
    columns: props.columns,
    filters: props.filters,
    adapter: props.urlAdapter,
    urlKey: props.urlKey,
  });
  let filtersNode: ReactNode;
  // Column-level `filter` shorthands alone must still render the auto form —
  // only explicit JSX takes over the drawing.
  if (isDeclarativeFilters(props.filters) || props.filters === undefined) {
    filtersNode =
      runtime.defs.length > 0 ? (
        <AutoFilterForm defs={runtime.defs} source={source} />
      ) : undefined;
  } else {
    filtersNode = props.filters;
  }
  return {
    ...props,
    source,
    filters: filtersNode,
    filterLabels: { ...runtime.filterLabels, ...props.filterLabels },
  };
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
  const { slots, className } = props;
  const size = tableSize(props.size, props.density);
  const { filtersMode = "popover" } = props;
  const chromeProps = useChromeProps(props);
  const { source, filters: filtersNode } = chromeProps;
  const c = useTableChrome<TRow>(chromeProps);
  const { table, confirm, getRowId } = c;
  const { labels } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTrigger = useFilterTriggerToggle(filtersOpen, setFiltersOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, c, chromeProps);
  const { virtualization, loadMoreRef, canLoadMore, virtualScrollRef } =
    useChromeBodyData(c, chromeProps);
  const columnMenu = props.enableColumnMenu && !c.isMobile && (
    <ColumnMenu
      allColumns={c.allColumns}
      layout={c.columnLayout}
      labels={labels}
    />
  );
  // Saved views capture the table's own URL params, so the menu defaults to
  // the table's URL backend + namespace (an explicit option still wins).
  const savedViewsMenu = props.savedViews && (
    <SavedViewsMenu
      options={{
        adapter: props.urlAdapter,
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
        rows={props.skeletonRows ?? source.limit}
        columns={table.columns.length}
        loadingLabel={labels.loading}
      />
    );
  } else if (c.body === "empty") {
    body = slots?.empty ?? (
      <Stack role="status" spacing={1.5} alignItems="center" sx={{ py: 6 }}>
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
    body = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={props.rowActions}
        confirm={confirm}
        getRowId={getRowId}
        size={size}
        dir={props.dir}
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
        renderRowDetail={props.renderRowDetail}
        summaryRow={props.summaryRow}
        expansion={c.detail?.expansion}
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
        rowActions={props.rowActions}
        confirm={confirm}
        getRowId={getRowId}
        size={size}
        dir={props.dir}
        prefetch={props.prefetch}
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
        renderRowDetail={props.renderRowDetail}
        summaryRow={props.summaryRow}
        expansion={c.detail?.expansion}
        rowEntries={virtualization.enabled ? virtualization.rows : undefined}
        paddingTop={virtualization.paddingTop}
        paddingBottom={virtualization.paddingBottom}
        measureElement={virtualization.measureElement}
        stickyHeader={props.stickyHeader}
        stickyTop={props.stickyTop}
        pinOffset={c.columnLayout.pinOffset}
        maxHeight={props.maxHeight}
        virtualScrollRef={virtualScrollRef}
        setWidth={resizeSetter(props.resizableColumns, c.columnLayout.setWidth)}
        columnWidths={c.columnLayout.state.widths}
        resizeLabel={labels.resizeColumn}
      />
    );
  }

  return (
    <Paper
      ref={rootRef}
      variant="outlined"
      dir={props.dir}
      className={className}
      aria-busy={c.isRefreshing || undefined}
      sx={{ p: 1.5 }}
    >
      <Stack spacing={1.5}>
        <Toolbar
          table={table}
          hideSearch={props.hideSearch}
          searchPlaceholder={props.searchPlaceholder}
          sortByOptions={props.sortByOptions}
          customToolbar={
            <>
              {savedViewsMenu}
              {props.toolbar}
            </>
          }
          hasFilters={Boolean(filtersNode)}
          activeFilterCount={c.activeFilterCount}
          showRowsPerPage={!c.isPaged}
          filtersMode={filtersMode}
          filters={filtersNode}
          filtersOpen={filtersOpen}
          onToggleFilters={filtersTrigger.onClick}
          onFiltersTriggerPointerDown={filtersTrigger.onPointerDown}
          onCloseFilters={() => setFiltersOpen(false)}
          onClearFilters={c.clearFilters}
          dir={props.dir}
          columnMenu={columnMenu}
        />
        {c.isRefreshing && <LinearProgress aria-label={labels.loading} />}
        <Chips
          chips={c.mergedChips}
          onClearAll={c.clearFilters}
          labels={labels}
        />
        {table.selection && props.bulkActions && (
          <BulkBar
            selection={table.selection}
            total={source.total}
            bulkActions={props.bulkActions}
            confirm={confirm}
            labels={labels}
          />
        )}
        {source.error ? (
          <ErrorState
            error={source.error}
            labels={labels}
            onRetry={source.refetch ? () => void source.refetch?.() : undefined}
          />
        ) : (
          body
        )}
        {canLoadMore && source.hasNextPage && (
          <Box ref={loadMoreRef} display="flex" justifyContent="center" py={1}>
            <Button
              variant="outlined"
              size="small"
              disabled={source.isFetchingNextPage}
              onClick={() => source.fetchNextPage()}
            >
              {labels.loadMore}
            </Button>
          </Box>
        )}
        {c.showFooter && (
          <Footer
            pagination={table.pagination}
            total={source.total}
            limit={source.limit}
            setPage={source.setPage}
            setLimit={source.setLimit}
            labels={labels}
          />
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
    </Paper>
  );
}
