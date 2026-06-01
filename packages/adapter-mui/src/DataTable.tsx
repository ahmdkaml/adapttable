import {
  type ActiveFilterChip,
  defaultConfirm,
  useDataTable,
  useIsMobile,
} from "@adapttable/core";
import { Paper, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import {
  BulkBar,
  Chips,
  ErrorState,
  FilterDrawer,
  Footer,
  LoadingState,
  Toolbar,
} from "./components/chrome";
import { DesktopTable, MobileCards } from "./components/tables";
import type { DataTableProps } from "./types";

/**
 * Batteries-included Material UI data table. Drop in `columns`, a `source`,
 * and a `rowKey` for a fully styled, sortable, filterable, paginated MUI
 * table with selection, bulk actions, RTL, and dark mode — a free
 * DataGrid-style experience on the headless `@adapttable/core` engine.
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
    labels: labelOverrides,
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
    className,
    toolbar: customToolbar,
    confirm: confirmProp,
    skeletonRows = 5,
    size = "medium",
  } = props;

  const autoMobile = useIsMobile();
  const isMobile = isMobileProp ?? autoMobile;
  const confirm = confirmProp ?? defaultConfirm;

  const table = useDataTable<TRow>({
    source,
    columns,
    rowKey,
    tableLabel,
    labels: labelOverrides,
    dir,
    isMobile,
    bulkActions,
    selectionGetId,
    filterLabels,
  });

  const { labels } = table;
  const getRowId = selectionGetId ?? rowKey;
  const [drawerOpen, setDrawerOpen] = useState(false);

  const mergedChips = useMemo<readonly ActiveFilterChip[]>(() => {
    if (!extraChips?.length) return table.filterChips;
    if (table.filterChips.length === 0) return extraChips;
    return [...table.filterChips, ...extraChips];
  }, [table.filterChips, extraChips]);

  const activeFilterCount =
    activeFilterCountProp && activeFilterCountProp > 0
      ? activeFilterCountProp
      : mergedChips.length;

  const isPaged = source.paginationMode === "paged";

  let body: React.ReactNode;
  if (source.isLoading && source.rows.length === 0) {
    body = slots?.skeleton ?? (
      <LoadingState rows={skeletonRows} columns={table.columns.length} />
    );
  } else if (table.isEmpty) {
    body = slots?.empty ?? (
      <Typography color="text.secondary" align="center" sx={{ py: 6 }}>
        {labels.noData}
      </Typography>
    );
  } else if (isMobile) {
    body = (
      <MobileCards
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        getRowId={getRowId}
        size={size}
      />
    );
  } else {
    body = (
      <DesktopTable
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        getRowId={getRowId}
        size={size}
        prefetch={prefetch}
      />
    );
  }

  return (
    <Paper variant="outlined" dir={dir} className={className} sx={{ p: 1.5 }}>
      <Stack spacing={1.5}>
        <Toolbar
          table={table}
          hideSearch={hideSearch}
          searchPlaceholder={searchPlaceholder}
          sortByOptions={sortByOptions}
          customToolbar={customToolbar}
          hasFilters={Boolean(filters)}
          activeFilterCount={activeFilterCount}
          onOpenFilters={() => setDrawerOpen(true)}
          showRowsPerPage={!isPaged}
        />
        <Chips
          chips={mergedChips}
          onClearAll={onClearFilters}
          labels={labels}
        />
        {table.selection && bulkActions && (
          <BulkBar
            selection={table.selection}
            bulkActions={bulkActions}
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
        {isPaged && !source.error && (source.total > 0 || source.isLoading) && (
          <Footer
            pagination={table.pagination}
            total={source.total}
            setPage={source.setPage}
            labels={labels}
          />
        )}
      </Stack>
      {filters && (
        <FilterDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          filters={filters}
          activeFilterCount={activeFilterCount}
          onClearFilters={onClearFilters}
          labels={labels}
        />
      )}
    </Paper>
  );
}
