import type { TableSource } from "@adapttable/core";
import {
  ExportAnnouncer,
  GridFocusAnnouncer,
  useDataTableShell,
  useMountStagger,
} from "@adapttable/core/adapter";
import type { ReactElement, ReactNode, RefObject } from "react";

import { Chips } from "./components/ActiveFilterChips";
import { AutoFilterForm } from "./components/AutoFilterForm";
import { BulkBar } from "./components/BulkActionBar";
import { ColumnMenu } from "./components/ColumnMenu";
import { DesktopTable } from "./components/DesktopTable";
import { ErrorState } from "./components/ErrorState";
import { FilterPanel } from "./components/FilterPanel";
import { FilterPopover } from "./components/FilterPopover";
import { FiltersIcon, SearchIcon } from "./components/icons";
import { MobileCards } from "./components/MobileCards";
import { Footer, RowsPerPageSelect } from "./components/PaginationFooter";
import { SavedViewsMenu } from "./components/SavedViewsMenu";
import { LoadingState } from "./components/TableSkeleton";
import { cx } from "./cx";
import type { DataTableClassNames, DataTableProps } from "./types";

// A stable default: the memoized desktop rows compare `classNames` by
// identity, so an inline `{}` default would defeat them on every render.
const NO_CLASSNAMES: DataTableClassNames = {};

/**
 * `DataTableProps` after tier resolution: the source is definite (whichever
 * tier provided it) and `filters` is plain JSX (the auto-built form when the
 * caller passed the declarative array).
 */
type ResolvedDataTableProps<TRow> = Omit<
  DataTableProps<TRow>,
  "source" | "filters"
> & {
  source: TableSource<TRow>;
  filters?: ReactNode;
};

/** The shell's return shape, derived so no extra public type is needed. */
type ShellResult<TRow> = ReturnType<typeof useDataTableShell<TRow>>;

interface DataTableBodyProps<TRow> {
  chrome: ShellResult<TRow>["chrome"];
  props: Readonly<ResolvedDataTableProps<TRow>>;
  classNames: NonNullable<DataTableProps<TRow>["classNames"]>;
  labels: ShellResult<TRow>["labels"];
  /** The shell's kit-agnostic render bundle, spread straight onto the renderer. */
  tableProps: ShellResult<TRow>["tableProps"];
}

function DataTableBody<TRow>({
  chrome,
  props,
  classNames,
  labels,
  tableProps,
}: Readonly<DataTableBodyProps<TRow>>): ReactElement {
  // The shell already applied the column layout to the injected actions
  // column: hidden strips `rowActions` before the renderers, an end pin sets
  // `actionsPinned`.
  const rowActions = tableProps.rowActions;
  if (chrome.body === "skeleton") {
    return (
      <>
        {props.slots?.skeleton ?? (
          <LoadingState
            rows={props.skeletonRows ?? props.source.limit}
            columns={chrome.table.columns.length}
            variant={chrome.isMobile ? "cards" : "table"}
            labels={labels}
            classNames={classNames}
            hasActions={(rowActions?.length ?? 0) > 0}
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
        {(noResults ? props.slots?.noResults : undefined) ??
          props.slots?.empty ?? (
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
  return <Renderer {...tableProps} classNames={classNames} />;
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
    searchPlaceholder,
    sortByOptions,
    dir,
    filtersMode = "popover",
    bulkActions,
    classNames = NO_CLASSNAMES,
    toolbar,
    animate = false,
  } = props;

  const density = props.density ?? "comfortable";

  // The whole shared orchestration — data tier, filter runtime, chrome,
  // scroll reset, body windowing — lives in core's shell; this file renders
  // only semantic markup with class hooks over it.
  const shell = useDataTableShell<TRow>(props, (defs, source) => (
    <AutoFilterForm
      defs={defs}
      source={source}
      classNames={classNames}
      labels={props.labels}
    />
  ));
  const {
    chrome,
    table,
    labels,
    filtersNode: filters,
    filtersOpen,
    setFiltersOpen,
    filtersTrigger,
    rootRef,
    canLoadMore,
    tableProps,
  } = shell;
  // Everything rendered below reads the chrome's VIEW facade — identical to
  // the raw source except under grouping, where it presents the full set.
  const viewSource = shell.source;
  const chromeProps: ResolvedDataTableProps<TRow> = {
    ...props,
    source: viewSource,
    filters,
  };
  useMountStagger(rootRef, [viewSource.rows.length, chrome.isMobile], {
    enabled: animate,
  });
  // React 18's `ref` attribute rejects core's `RefObject<HTMLDivElement |
  // null>` through interface variance; the same object viewed through its
  // structural shape attaches fine.
  const loadMoreRef: RefObject<HTMLDivElement | null> = shell.loadMoreRef;
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
      style={{ flexShrink: 0, whiteSpace: "nowrap" }}
      onPointerDown={filtersTrigger.onPointerDown}
      onClick={filtersTrigger.onClick}
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

  // The export button comes from the shell, already single-flight and already
  // carrying the selection, the full column set and the highlighted range. It
  // used to be rebuilt here from the same parts, which is precisely how a new
  // scope can work in seven kits and silently fall back in the eighth.
  const { onExportCsv, exportBusy, exportAnnouncement } = shell.toolbarProps;

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
      <GridFocusAnnouncer focus={shell.gridFocus} />
      <div
        data-adapttable-part="toolbar"
        className={classNames.toolbar}
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          rowGap: 8,
        }}
      >
        {props.searchable !== false && (
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
              value={viewSource.sortBy ?? ""}
              onChange={(e) =>
                viewSource.setSort(
                  e.currentTarget.value || undefined,
                  viewSource.sortDir ?? "asc"
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
        {toolbar}
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
        {props.savedViews && (
          // The menu must capture/apply through the SAME URL backend and
          // namespace the table reads, so those default from the table's
          // own props (explicit option values still win).
          <SavedViewsMenu
            options={{
              urlAdapter: shell.urlAdapter,
              urlKey: props.urlKey,
              ...props.savedViews,
            }}
            labels={labels}
            classNames={classNames}
          />
        )}
        {props.enableColumnMenu && !chrome.isMobile && (
          <ColumnMenu
            allColumns={chrome.allColumns}
            layout={chrome.columnLayout}
            labels={labels}
            classNames={classNames}
            hasRowActions={(props.rowActions?.length ?? 0) > 0}
          />
        )}
        {onExportCsv && (
          <>
            <button
              type="button"
              data-adapttable-part="export-csv-button"
              className={classNames.exportCsvButton}
              style={{ flexShrink: 0, whiteSpace: "nowrap" }}
              onClick={onExportCsv}
              disabled={exportBusy}
              aria-busy={exportBusy}
            >
              {/* No kit to borrow a loading button from, so the affordance is an
                  element the host can style — `aria-hidden` because the
                  announcement below is what a screen reader should hear, not a
                  decoration. */}
              {exportBusy && (
                <span
                  aria-hidden="true"
                  data-adapttable-part="export-spinner"
                  className={classNames.exportSpinner}
                />
              )}
              {labels.exportCsv}
            </button>
            <ExportAnnouncer announcement={exportAnnouncement} />
          </>
        )}
        {canLoadMore && !chrome.grouping && (
          <RowsPerPageSelect
            source={viewSource}
            labels={labels}
            classNames={classNames}
          />
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
          total={viewSource.total}
          bulkActions={bulkActions}
          confirm={chrome.confirm}
          labels={labels}
          classNames={classNames}
        />
      )}

      {chrome.isRefreshing && (
        // Native indeterminate progress (no `value`) — implicit progressbar
        // role with correct semantics on every device.
        <progress
          aria-label={labels.loading}
          data-adapttable-part="refresh-indicator"
          className={classNames.refreshIndicator}
        />
      )}

      {viewSource.error ? (
        <ErrorState
          error={viewSource.error}
          labels={labels}
          onRetry={
            viewSource.refetch ? () => void viewSource.refetch?.() : undefined
          }
          classNames={classNames}
        />
      ) : (
        <DataTableBody
          chrome={chrome}
          props={chromeProps}
          classNames={classNames}
          labels={labels}
          tableProps={tableProps}
        />
      )}

      {canLoadMore && viewSource.hasNextPage && (
        <div
          ref={loadMoreRef}
          data-adapttable-part="load-more"
          className={classNames.loadMore}
        >
          <button
            type="button"
            disabled={viewSource.isFetchingNextPage}
            data-adapttable-part="load-more-button"
            className={classNames.loadMoreButton}
            onClick={() => viewSource.fetchNextPage()}
          >
            {labels.loadMore}
          </button>
        </div>
      )}

      {chrome.showFooter && (
        <Footer
          pagination={table.pagination}
          source={viewSource}
          labels={labels}
          classNames={classNames}
          showRowsPerPage={!chrome.grouping}
        />
      )}
    </div>
  );
}
