import {
  useChromeBodyData,
  useChromeScrollReset,
  useTableChrome,
} from "@adapttable/core";
import {
  Box,
  Button,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { useRef, useState } from "react";

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
 * Batteries-included Material UI data table. Drop in `columns`, a `source`,
 * and a `rowKey` for a fully styled, sortable, filterable, paginated MUI
 * table with selection, bulk actions, RTL, and dark mode — a free
 * DataGrid-style experience on the headless `@adapttable/core` engine.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const { slots, className } = props;
  const size = tableSize(props.size, props.density);
  const { filtersMode = "popover" } = props;
  const c = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = c;
  const { labels, source } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, c, props);
  const { virtualization, loadMoreRef, canLoadMore } = useChromeBodyData(
    c,
    props
  );
  const columnMenu = props.enableColumnMenu && !c.isMobile && (
    <ColumnMenu
      allColumns={c.allColumns}
      layout={c.columnLayout}
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
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
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
        prefetch={props.prefetch}
        onRowClick={props.onRowClick}
        rowClassName={props.rowClassName}
        rowEntries={virtualization.enabled ? virtualization.rows : undefined}
        paddingTop={virtualization.paddingTop}
        paddingBottom={virtualization.paddingBottom}
        measureElement={virtualization.measureElement}
        stickyHeader={props.stickyHeader}
        stickyTop={props.stickyTop}
        pinOffset={c.columnLayout.pinOffset}
        maxHeight={props.maxHeight}
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
          customToolbar={props.toolbar}
          hasFilters={Boolean(props.filters)}
          activeFilterCount={c.activeFilterCount}
          showRowsPerPage={!c.isPaged}
          filtersMode={filtersMode}
          filters={props.filters}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
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
      {props.filters && filtersMode === "drawer" && (
        <FilterDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={props.filters}
          activeFilterCount={c.activeFilterCount}
          onClearFilters={c.clearFilters}
          labels={labels}
          dir={props.dir}
        />
      )}
    </Paper>
  );
}
