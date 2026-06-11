import {
  pageSizeOptions,
  type TableVirtualization,
  useChromeBodyData,
  useChromeScrollReset,
  useTableChrome,
} from "@adapttable/core";
import type { MutableRefObject, ReactElement } from "react";
import { useRef, useState } from "react";

import {
  BulkBar,
  Chips,
  ErrorState,
  Footer,
  LoadingState,
} from "./components/chrome";
import { ColumnMenu } from "./components/ColumnMenu";
import { FilterPanel } from "./components/FilterPanel";
import { FilterPopover } from "./components/FilterPopover";
import { FiltersIcon, SearchIcon } from "./components/icons";
import { DesktopTable, MobileCards } from "./components/tables";
import { cx } from "./cx";
import type { DataTableProps } from "./types";

interface DataTableBodyProps<TRow> {
  chrome: ReturnType<typeof useTableChrome<TRow>>;
  props: Readonly<DataTableProps<TRow>>;
  classNames: NonNullable<DataTableProps<TRow>["classNames"]>;
  confirm: ReturnType<typeof useTableChrome<TRow>>["confirm"];
  getRowId: ReturnType<typeof useTableChrome<TRow>>["getRowId"];
  virtualization: TableVirtualization<TRow>;
  labels: ReturnType<typeof useTableChrome<TRow>>["table"]["labels"];
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
        {props.slots?.skeleton ?? props.loadingState ?? (
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
    // "noResults" means an active search/filter matched nothing — say so and
    // offer a clear CTA; "noData" means the source itself is empty.
    const noResults = chrome.emptyVariant === "noResults";
    return (
      <>
        {props.slots?.empty ?? props.emptyState ?? (
          <output data-adapttable-part="empty" className={classNames.empty}>
            {noResults ? labels.noResults : labels.noData}
            {noResults && (
              <button
                type="button"
                data-adapttable-part="empty-clear"
                className={classNames.emptyClear}
                onClick={chrome.clearFilters}
              >
                {labels.clearAll}
              </button>
            )}
          </output>
        )}
      </>
    );
  }
  const Renderer = chrome.isMobile ? MobileCards : DesktopTable;
  return (
    <Renderer
      table={chrome.table}
      rows={props.source.rows}
      rowActions={props.rowActions}
      confirm={confirm}
      getRowId={getRowId}
      classNames={classNames}
      prefetch={props.prefetch}
      onRowClick={props.onRowClick}
      rowClassName={props.rowClassName}
      rowEntries={virtualization.enabled ? virtualization.rows : undefined}
      paddingTop={virtualization.paddingTop}
      paddingBottom={virtualization.paddingBottom}
      measureElement={virtualization.measureElement}
      stickyHeader={props.stickyHeader}
      stickyTop={props.stickyTop}
      pinOffset={chrome.columnLayout.pinOffset}
      maxHeight={props.maxHeight}
      setWidth={
        props.resizableColumns ? chrome.columnLayout.setWidth : undefined
      }
      columnWidths={chrome.columnLayout.state.widths}
      resizeLabel={labels.resizeColumn}
    />
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
    searchPlaceholder,
    sortByOptions,
    dir,
    hideSearch,
    filters,
    filtersMode = "popover",
    bulkActions,
    classNames = {},
    toolbar: customToolbar,
  } = props;

  const density = props.density ?? "comfortable";

  const chrome = useTableChrome<TRow>(props);
  const { table, confirm, getRowId } = chrome;
  const { labels } = table;
  const [filtersOpen, setFiltersOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  useChromeScrollReset(rootRef, chrome, props);
  const bodyData = useChromeBodyData(chrome, props);
  const { virtualization, canLoadMore } = bodyData;
  // React 18's `ref` attribute rejects core's `RefObject<HTMLDivElement |
  // null>` through interface variance; the same object viewed through its
  // structural shape attaches fine.
  const loadMoreRef: MutableRefObject<HTMLDivElement | null> =
    bodyData.loadMoreRef;
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );
  // Explicit options win; otherwise auto-derive on mobile, where the card
  // layout has no clickable headers to sort by.
  const sortOptions =
    sortByOptions ?? (chrome.isMobile ? table.sortByOptions : undefined);

  const filtersButton = (
    <button
      type="button"
      aria-expanded={filtersMode === "popover" ? filtersOpen : undefined}
      data-active={filtersOpen || undefined}
      data-adapttable-part="filters-button"
      className={classNames.filtersButton}
      onClick={() => setFiltersOpen((o) => !o)}
    >
      <span
        data-adapttable-part="filters-icon"
        className={classNames.filtersIcon}
        style={{ display: "inline-flex" }}
      >
        <FiltersIcon />
      </span>
      {labels.filters}
      {chrome.activeFilterCount > 0 && (
        <span
          data-adapttable-part="filters-count"
          className={classNames.filtersCount}
        >
          {chrome.activeFilterCount}
        </span>
      )}
    </button>
  );

  return (
    <div
      ref={rootRef}
      dir={dir}
      data-adapttable-part="root"
      data-mobile={chrome.isMobile || undefined}
      data-density={density}
      data-refreshing={chrome.isRefreshing || undefined}
      // The root wraps the whole table region, so a background refresh marks
      // it busy for assistive tech (the indicator below is decorative-ish).
      aria-busy={chrome.isRefreshing || undefined}
      className={cx("adapttable", classNames.root)}
    >
      <div
        data-adapttable-part="toolbar"
        className={classNames.toolbar}
        style={{ display: "flex", flexWrap: "nowrap", alignItems: "center" }}
      >
        {!hideSearch && (
          <span
            data-adapttable-part="search-field"
            className={classNames.searchField}
            style={{
              flex: 1,
              minWidth: 0,
              display: "inline-flex",
              alignItems: "center",
            }}
          >
            <span
              data-adapttable-part="search-icon"
              className={classNames.searchIcon}
              style={{ display: "inline-flex" }}
            >
              <SearchIcon size={14} />
            </span>
            <input
              {...searchProps}
              data-adapttable-part="search"
              className={classNames.search}
              style={{ flex: 1, minWidth: 0 }}
            />
          </span>
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
        {filters &&
          (filtersMode === "popover" ? (
            <FilterPopover
              open={filtersOpen}
              onClose={() => setFiltersOpen(false)}
              filters={filters}
              activeFilterCount={chrome.activeFilterCount}
              onClearFilters={chrome.clearFilters}
              labels={labels}
              dir={dir}
              classNames={classNames}
            >
              {filtersButton}
            </FilterPopover>
          ) : (
            filtersButton
          ))}
        {props.enableColumnMenu && !chrome.isMobile && (
          <ColumnMenu
            allColumns={chrome.allColumns}
            layout={chrome.columnLayout}
            labels={labels}
            classNames={classNames}
          />
        )}
        {!chrome.isPaged && (
          <label>
            {labels.rowsPerPage}{" "}
            <select
              aria-label={labels.rowsPerPage}
              data-adapttable-part="rows-per-page"
              className={classNames.rowsPerPageSelect}
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

      {filters && filtersMode === "drawer" && (
        <FilterPanel
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          filters={filters}
          activeFilterCount={chrome.activeFilterCount}
          onClearFilters={chrome.clearFilters}
          labels={labels}
          dir={dir}
          classNames={classNames}
        />
      )}

      <Chips
        chips={chrome.mergedChips}
        onClearAll={chrome.clearFilters}
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

      {chrome.isRefreshing && (
        <div
          role="progressbar"
          aria-label={labels.loading}
          data-adapttable-part="refresh-indicator"
          className={classNames.refreshIndicator}
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
