import {
  type ActiveFilterChip,
  defaultConfirm,
  useDataTable,
  useIsMobile,
} from "@adapttable/core";
import { useMemo, useState } from "react";

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

const PAGE_SIZES = [10, 25, 50, 100];

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
    columns,
    rowKey,
    rowActions,
    tableLabel,
    searchPlaceholder,
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
    classNames = {},
    toolbar: customToolbar,
    confirm: confirmProp,
    skeletonRows = 5,
    emptyState,
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
  const [filtersOpen, setFiltersOpen] = useState(false);

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
  const searchProps = table.getSearchInputProps(
    searchPlaceholder ? { placeholder: searchPlaceholder } : undefined
  );

  let body: React.ReactNode;
  if (source.isLoading && source.rows.length === 0) {
    body = (
      <LoadingState
        rows={skeletonRows}
        labels={labels}
        classNames={classNames}
      />
    );
  } else if (table.isEmpty) {
    body = emptyState ?? (
      <div data-adapttable-part="empty" className={classNames.empty}>
        {labels.noData}
      </div>
    );
  } else {
    const Renderer = isMobile ? MobileCards : DesktopTable;
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
      data-mobile={isMobile || undefined}
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
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </button>
        )}
        {!isPaged && (
          <label>
            {labels.rowsPerPage}{" "}
            <select
              aria-label={labels.rowsPerPage}
              value={source.limit}
              onChange={(e) => source.setLimit(Number(e.currentTarget.value))}
            >
              {PAGE_SIZES.map((n) => (
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
            disabled={activeFilterCount === 0}
          >
            {labels.clearAll}
          </button>
        </div>
      )}

      <Chips
        chips={mergedChips}
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

      {isPaged && !source.error && (source.total > 0 || source.isLoading) && (
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
