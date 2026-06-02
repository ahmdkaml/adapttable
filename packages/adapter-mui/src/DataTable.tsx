import { useInfiniteScroll, useTableChrome } from "@adapttable/core";
import { Box, Button, Paper, Stack, Typography } from "@mui/material";
import { useState } from "react";

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
  const { slots, className, size = "medium" } = props;
  const c = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = c;
  const { labels, source } = table;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: () => source.fetchNextPage(),
    itemCount: source.rows.length,
    enabled: !c.isPaged && !source.error,
  });

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
      <Typography
        role="status"
        color="text.secondary"
        align="center"
        sx={{ py: 6 }}
      >
        {labels.noData}
      </Typography>
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
      />
    );
  }

  return (
    <Paper
      variant="outlined"
      dir={props.dir}
      className={className}
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
          onOpenFilters={() => setDrawerOpen(true)}
          showRowsPerPage={!c.isPaged}
        />
        <Chips
          chips={c.mergedChips}
          onClearAll={props.onClearFilters}
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
        {!c.isPaged && !source.error && source.hasNextPage && (
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
      {props.filters && (
        <FilterDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          filters={props.filters}
          activeFilterCount={c.activeFilterCount}
          onClearFilters={props.onClearFilters}
          labels={labels}
        />
      )}
    </Paper>
  );
}
