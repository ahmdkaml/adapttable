import {
  pageSizeOptions,
  useInfiniteScroll,
  useTableChrome,
} from "@adapttable/core";
import { useState } from "react";

import {
  BulkBar,
  Chips,
  ErrorState,
  Footer,
  LoadingState,
} from "./components/chrome";
import { DesktopTable, MobileCards } from "./components/tables";
import { cx } from "./cx";
import type { DataTableProps } from "./types";

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
    rowActions,
    searchPlaceholder,
    sortByOptions,
    dir,
    prefetch,
    hideSearch,
    filters,
    onClearFilters,
    bulkActions,
    classNames = {},
    toolbar: customToolbar,
    skeletonRows,
    emptyState,
    loadingState,
  } = props;

  const chrome = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = chrome;
  const { labels } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);

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

  let body: React.ReactNode;
  if (chrome.body === "skeleton") {
    body = loadingState ?? (
      <LoadingState
        rows={skeletonRows ?? source.limit}
        labels={labels}
        classNames={classNames}
      />
    );
  } else if (chrome.body === "empty") {
    body = emptyState ?? (
      <output data-adapttable-part="empty" className={classNames.empty}>
        {labels.noData}
      </output>
    );
  } else {
    const Renderer = chrome.isMobile ? MobileCards : DesktopTable;
    body = (
      <Renderer
        table={table}
        rows={source.rows}
        rowActions={rowActions}
        confirm={confirm}
        getRowId={getRowId}
        classNames={classNames}
        prefetch={prefetch}
      />
    );
  }

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

      {filters && filtersOpen && (
        <div
          data-adapttable-part="filters-panel"
          className={classNames.filtersPanel}
        >
          {filters}
          <button
            type="button"
            onClick={() => onClearFilters?.()}
            disabled={chrome.activeFilterCount === 0}
          >
            {labels.clearAll}
          </button>
        </div>
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
        body
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
