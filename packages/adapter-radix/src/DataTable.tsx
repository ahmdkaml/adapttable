import {
  ACTIONS_COLUMN_KEY,
  isDeclarativeFilters,
  type TableBodyRegion,
  useChromeBodyData,
  useChromeScrollReset,
  useFilterTriggerToggle,
  useTableChrome,
  useTableData,
} from "@adapttable/core";
import { Box, Button, Flex, Progress, Text } from "@radix-ui/themes";
import { type ReactNode, useRef, useState } from "react";

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
import { subtleText } from "./styles";
import type { DataTableProps } from "./types";

/**
 * Batteries-included Radix Themes data table. Drop in `columns`, a `rowKey`,
 * and either raw `data` (frontend tier — add `onQueryChange` for the server
 * tier) or a prebuilt `source`, for a fully styled, sortable, filterable,
 * paginated Radix table with selection, bulk actions, RTL, and dark mode — on
 * the headless `@adapttable/core` engine. A declarative `filters` array renders
 * the auto-built Radix filter form.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const { slots, accentColor } = props;
  const { filtersMode = "popover" } = props;
  // Map row density to a Radix table `size` (independent of column pinning):
  // compact → "1", comfortable (default) → "2". An explicit `size` prop, if
  // given, still wins.
  const size =
    props.size ?? ((props.density ?? "comfortable") === "compact" ? "1" : "2");
  // Resolve the data tier (source > onQueryChange server > frontend) and the
  // declarative-filter runtime (defs, chip labels, URL keys, predicate).
  const { source, runtime } = useTableData<TRow>({
    locale: props.locale,
    source: props.source,
    data: props.data,
    total: props.total,
    loading: props.loading,
    onQueryChange: props.onQueryChange,
    adapter: props.urlSync === false ? undefined : props.urlAdapter,
    enabled: props.urlSync,
    urlKey: props.urlKey,
    columns: props.columns,
    filters: props.filters,
  });
  // Declarative `filters` array → the auto-built form; JSX passes through.
  const autoForm =
    runtime.defs.length > 0 ? (
      <AutoFilterForm
        defs={runtime.defs}
        source={source}
        accentColor={accentColor}
        dir={props.dir}
        labels={props.labels}
      />
    ) : undefined;
  // Column-level `filter` shorthands alone must still render the auto form —
  // only explicit JSX takes over the drawing.
  const filtersNode =
    isDeclarativeFilters(props.filters) || props.filters === undefined
      ? autoForm
      : props.filters;
  const chromeProps = {
    ...props,
    source,
    filters: filtersNode,
    filterLabels: { ...runtime.filterLabels, ...props.filterLabels },
  };
  const chrome = useTableChrome<TRow>(chromeProps);
  const { table, confirm, getRowId } = chrome;
  const { labels } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersTrigger = useFilterTriggerToggle(filtersOpen, setFiltersOpen);
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, chrome, chromeProps);
  const { virtualization, loadMoreRef, canLoadMore, virtualScrollRef } =
    useChromeBodyData(chrome, chromeProps);

  // The injected actions column is first-class in column management: the layout
  // state treats its reserved key like any column key, so the Columns menu can
  // hide it (strip rowActions before the renderers) or end-pin it (the
  // renderers stick the actions cells, with zero data columns pinned).
  const hasRowActions = Boolean(props.rowActions?.length);
  const rowActions = chrome.columnLayout.isHidden(ACTIONS_COLUMN_KEY)
    ? undefined
    : props.rowActions;
  const actionsPinned =
    chrome.columnLayout.state.pinned[ACTIONS_COLUMN_KEY] === "end";

  const tableProps = {
    table,
    rows: source.rows,
    rowActions,
    actionsPinned,
    confirm,
    getRowId,
    size,
    accentColor,
    rowEntries: virtualization.enabled ? virtualization.rows : undefined,
    paddingTop: virtualization.paddingTop,
    paddingBottom: virtualization.paddingBottom,
    measureElement: virtualization.measureElement,
    stickyHeader: props.stickyHeader,
    stickyTop: props.stickyTop,
    pinOffset: chrome.columnLayout.pinOffset,
    maxHeight: props.maxHeight,
    virtualScrollRef,
    setWidth: props.resizableColumns ? chrome.columnLayout.setWidth : undefined,
    columnWidths: chrome.columnLayout.state.widths,
    resizeLabel: table.labels.resizeColumn,
    onRowClick: props.onRowClick,
    rowClassName: props.rowClassName,
    renderRowDetail: props.renderRowDetail,
    summaryRow: props.summaryRow,
    expansion: chrome.detail?.expansion,
    dir: props.dir,
  };
  const bodyByRegion: Record<TableBodyRegion, ReactNode> = {
    skeleton: slots?.skeleton ?? (
      <LoadingState
        rows={props.skeletonRows ?? source.limit}
        columns={table.columns.length}
        loadingLabel={labels.loading}
      />
    ),
    empty:
      slots?.empty ??
      (chrome.emptyVariant === "noResults" ? (
        <Flex role="status" direction="column" align="center" py="6" gap="3">
          <Text {...subtleText}>{labels.noResults}</Text>
          <Button
            size="2"
            variant="outline"
            color={accentColor}
            onClick={chrome.clearFilters}
          >
            {labels.clearAll}
          </Button>
        </Flex>
      ) : (
        <Text
          role="status"
          {...subtleText}
          align="center"
          style={{ display: "block", padding: "var(--space-6) 0" }}
        >
          {labels.noData}
        </Text>
      )),
    mobile: <MobileCards {...tableProps} className={props.classNames?.card} />,
    desktop: (
      <DesktopTable
        {...tableProps}
        prefetch={props.prefetch}
        className={props.classNames?.table}
      />
    ),
  };

  return (
    <Box
      ref={rootRef}
      dir={props.dir}
      className={props.classNames?.root}
      aria-busy={chrome.isRefreshing || undefined}
      p="3"
      style={{
        border: "1px solid var(--gray-a5)",
        borderRadius: "var(--radius-4)",
      }}
    >
      <Flex direction="column" gap="3">
        <Toolbar
          className={props.classNames?.toolbar}
          table={table}
          hideSearch={props.hideSearch}
          searchPlaceholder={props.searchPlaceholder}
          sortByOptions={props.sortByOptions}
          customToolbar={props.toolbar}
          hasFilters={Boolean(filtersNode)}
          activeFilterCount={chrome.activeFilterCount}
          filtersMode={filtersMode}
          filters={filtersNode}
          filtersOpen={filtersOpen}
          onToggleFilters={filtersTrigger.onClick}
          onFiltersTriggerPointerDown={filtersTrigger.onPointerDown}
          onCloseFilters={() => setFiltersOpen(false)}
          onClearFilters={chrome.clearFilters}
          savedViewsMenu={
            props.savedViews ? (
              <SavedViewsMenu
                options={{
                  adapter: props.urlAdapter,
                  urlKey: props.urlKey,
                  ...props.savedViews,
                }}
                labels={labels}
                accentColor={accentColor}
              />
            ) : undefined
          }
          columnMenu={
            props.enableColumnMenu && !chrome.isMobile ? (
              <ColumnMenu
                allColumns={chrome.allColumns}
                layout={chrome.columnLayout}
                labels={table.labels}
                hasRowActions={hasRowActions}
              />
            ) : undefined
          }
          showRowsPerPage={canLoadMore}
          accentColor={accentColor}
          dir={props.dir}
        />
        {chrome.isRefreshing && (
          <Progress size="1" duration="1.5s" aria-label={labels.loading} />
        )}
        <Chips
          chips={chrome.mergedChips}
          onClearAll={chrome.clearFilters}
          labels={labels}
        />
        {table.selection && props.bulkActions && (
          <BulkBar
            selection={table.selection}
            total={source.total}
            bulkActions={props.bulkActions}
            confirm={confirm}
            labels={labels}
            accentColor={accentColor}
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
        {canLoadMore && source.hasNextPage && (
          <Flex ref={loadMoreRef} justify="center" py="2">
            <Button
              size="2"
              variant="outline"
              loading={source.isFetchingNextPage}
              onClick={() => source.fetchNextPage()}
            >
              {labels.loadMore}
            </Button>
          </Flex>
        )}
        {chrome.showFooter && (
          <Footer
            className={props.classNames?.footer}
            pagination={table.pagination}
            total={source.total}
            limit={source.limit}
            setPage={source.setPage}
            setLimit={source.setLimit}
            labels={labels}
          />
        )}
      </Flex>
      {filtersNode && filtersMode === "drawer" && (
        <FilterDrawer
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filtersNode}
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={chrome.clearFilters}
          labels={labels}
          accentColor={accentColor}
          dir={props.dir}
        />
      )}
    </Box>
  );
}
