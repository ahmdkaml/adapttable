import {
  DEFAULT_CARD_SIZE_PX,
  DEFAULT_ROW_SIZE_PX,
  pageSizeOptions,
  useInfiniteScroll,
  useTableChrome,
  useTableVirtualization,
} from "@adapttable/core";
import type { ReactElement } from "react";
import { useCallback, useState } from "react";

import {
  BulkBar,
  Chips,
  ErrorState,
  Footer,
  LoadingState,
} from "./components/chrome";
import { FilterPanel } from "./components/FilterPanel";
import { DesktopTable, MobileCards } from "./components/tables";
import { cx } from "./cx";
import type { DataTableProps } from "./types";

interface DataTableBodyProps<TRow> {
  chrome: ReturnType<typeof useTableChrome<TRow>>;
  props: Readonly<DataTableProps<TRow>>;
  classNames: NonNullable<DataTableProps<TRow>["classNames"]>;
  confirm: ReturnType<typeof useTableChrome<TRow>>["confirm"];
  getRowId: ReturnType<typeof useTableChrome<TRow>>["getRowId"];
  virtualization: ReturnType<typeof useTableVirtualization<TRow>>;
  labels: ReturnType<typeof useTableChrome<TRow>>["table"]["labels"];
}

function canVirtualizeBody(body: string): boolean {
  return body === "desktop" || body === "mobile";
}

function virtualEstimateSize(
  isMobile: boolean,
  estimateRowSize: number | undefined,
  estimateCardSize: number | undefined
): number {
  return isMobile
    ? (estimateCardSize ?? DEFAULT_CARD_SIZE_PX)
    : (estimateRowSize ?? DEFAULT_ROW_SIZE_PX);
}

function DataTableBody<TRow>({
  chrome,
  props,
  classNames,
  confirm,
  getRowId,
  virtualization,
  labels,
}: Readonly<DataTableBodyProps<TRow>>): ReactElement {
  if (chrome.body === "skeleton") {
    return (
      <>
        {props.loadingState ?? (
          <LoadingState
            rows={props.skeletonRows ?? props.source.limit}
            columns={chrome.table.columns.length}
            variant={chrome.isMobile ? "cards" : "table"}
            labels={labels}
            classNames={classNames}
            hasActions={(props.rowActions?.length ?? 0) > 0}
          />
        )}
      </>
    );
  }
  if (chrome.body === "empty") {
    return (
      <>
        {props.emptyState ?? (
          <output data-adapttable-part="empty" className={classNames.empty}>
            {labels.noData}
          </output>
        )}
      </>
    );
  }
  const Renderer = chrome.isMobile ? MobileCards : DesktopTable;
  return (
    <>
      <Renderer
        table={chrome.table}
        rows={props.source.rows}
        rowActions={props.rowActions}
        confirm={confirm}
        getRowId={getRowId}
        classNames={classNames}
        prefetch={props.prefetch}
        rowEntries={virtualization.enabled ? virtualization.rows : undefined}
        paddingTop={virtualization.paddingTop}
        paddingBottom={virtualization.paddingBottom}
        measureElement={virtualization.measureElement}
      />
    </>
  );
}

/**
 * Headless, unstyled AdaptTable for Tailwind / shadcn / custom CSS. Renders
 * semantic HTML with `data-adapttable-part` hooks and `className` overrides;
 * ships no styles of its own. Built on the `@adapttable/core` prop-getters.
 *
 * @typeParam TRow - The row type.
 */
export function DataTable<TRow>(props: Readonly<DataTableProps<TRow>>) {
  const {
    source,
    rowKey,
    searchPlaceholder,
    sortByOptions,
    dir,
    hideSearch,
    filters,
    onClearFilters,
    bulkActions,
    classNames = {},
    toolbar: customToolbar,
    virtualize = false,
    estimateRowSize,
    estimateCardSize,
    virtualOverscan,
    virtualScrollMargin,
  } = props;

  const chrome = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = chrome;
  const { labels } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const handleVirtualEndReached = useCallback(() => {
    if (source.hasNextPage && !source.isFetchingNextPage) {
      source.fetchNextPage();
    }
  }, [source]);
  const virtualization = useTableVirtualization({
    rows: source.rows,
    rowKey,
    enabled:
      virtualize &&
      !chrome.isPaged &&
      !source.error &&
      canVirtualizeBody(chrome.body),
    estimateSize: virtualEstimateSize(
      chrome.isMobile,
      estimateRowSize,
      estimateCardSize
    ),
    overscan: virtualOverscan,
    scrollMargin: virtualScrollMargin,
    onEndReached: handleVirtualEndReached,
  });

  const canLoadMore = !chrome.isPaged && !source.error;
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: () => source.fetchNextPage(),
    itemCount: source.rows.length,
    enabled: canLoadMore,
  });
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );
  // Explicit options win; otherwise auto-derive on mobile, where the card
  // layout has no clickable headers to sort by.
  const sortOptions =
    sortByOptions ?? (chrome.isMobile ? table.sortByOptions : undefined);

  return (
    <div
      dir={dir}
      data-adapttable-part="root"
      data-mobile={chrome.isMobile || undefined}
      className={cx("adapttable", classNames.root)}
    >
      <div data-adapttable-part="toolbar" className={classNames.toolbar}>
        {!hideSearch && (
          <input
            {...searchProps}
            data-adapttable-part="search"
            className={classNames.search}
          />
        )}
        {sortOptions && sortOptions.length > 0 && (
          <label>
            {labels.sortBy}{" "}
            <select
              aria-label={labels.sortBy}
              data-adapttable-part="sort-select"
              className={classNames.sortSelect}
              value={source.sortBy ?? ""}
              onChange={(e) =>
                source.setSort(
                  e.currentTarget.value || undefined,
                  source.sortDir ?? "asc"
                )
              }
            >
              <option value="">—</option>
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {customToolbar}
        {filters && (
          <button
            type="button"
            aria-expanded={filtersOpen}
            data-adapttable-part="filters-button"
            className={classNames.filtersButton}
            onClick={() => setFiltersOpen((o) => !o)}
          >
            {labels.filters}
            {chrome.activeFilterCount > 0
              ? ` (${chrome.activeFilterCount})`
              : ""}
          </button>
        )}
        {!chrome.isPaged && (
          <label>
            {labels.rowsPerPage}{" "}
            <select
              aria-label={labels.rowsPerPage}
              value={source.limit}
              onChange={(e) => source.setLimit(Number(e.currentTarget.value))}
            >
              {pageSizeOptions(source.limit).map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {filters && (
        <FilterPanel
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={onClearFilters}
          labels={labels}
          dir={dir}
          classNames={classNames}
        />
      )}

      <Chips
        chips={chrome.mergedChips}
        onClearAll={onClearFilters}
        labels={labels}
        classNames={classNames}
      />

      {table.selection && bulkActions && (
        <BulkBar
          selection={table.selection}
          bulkActions={bulkActions}
          confirm={confirm}
          labels={labels}
          classNames={classNames}
        />
      )}

      {source.error ? (
        <ErrorState
          error={source.error}
          labels={labels}
          onRetry={source.refetch ? () => void source.refetch?.() : undefined}
          classNames={classNames}
        />
      ) : (
        <DataTableBody
          chrome={chrome}
          props={props}
          classNames={classNames}
          confirm={confirm}
          getRowId={getRowId}
          virtualization={virtualization}
          labels={labels}
        />
      )}

      {canLoadMore && source.hasNextPage && (
        <div
          ref={loadMoreRef}
          data-adapttable-part="load-more"
          className={classNames.loadMore}
        >
          <button
            type="button"
            disabled={source.isFetchingNextPage}
            data-adapttable-part="load-more-button"
            className={classNames.loadMoreButton}
            onClick={() => source.fetchNextPage()}
          >
            {labels.loadMore}
          </button>
        </div>
      )}

      {chrome.showFooter && (
        <Footer
          pagination={table.pagination}
          source={source}
          labels={labels}
          classNames={classNames}
        />
      )}
    </div>
  );
}
