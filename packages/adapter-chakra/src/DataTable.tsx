import {
  type TableBody,
  useInfiniteScroll,
  useTableChrome,
} from "@adapttable/core";
import { Box, Button, Flex, Stack, Text } from "@chakra-ui/react";
import { type ReactNode, useState } from "react";

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
  const { slots, colorScheme, size = "md" } = props;
  const chrome = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = chrome;
  const { labels, source } = table;
  const [drawerOpen, setDrawerOpen] = useState(false);
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
    mobile: <MobileCards {...tableProps} />,
    desktop: <DesktopTable {...tableProps} prefetch={props.prefetch} />,
  };

  return (
    <Box dir={props.dir} borderWidth="1px" borderRadius="md" p={3}>
      <Stack spacing={3}>
        <Toolbar
          table={table}
          hideSearch={props.hideSearch}
          searchPlaceholder={props.searchPlaceholder}
          sortByOptions={props.sortByOptions}
          customToolbar={props.toolbar}
          hasFilters={Boolean(props.filters)}
          activeFilterCount={chrome.activeFilterCount}
          onOpenFilters={() => setDrawerOpen(true)}
          showRowsPerPage={!chrome.isPaged}
          colorScheme={colorScheme}
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
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={props.onClearFilters}
          labels={labels}
          colorScheme={colorScheme}
        />
      )}
    </Box>
  );
}
