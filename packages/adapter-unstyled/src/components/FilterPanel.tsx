import type { TableLabels } from "@adapttable/core";
import type { Direction } from "@adapttable/core";
import type { ReactNode } from "react";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

/** Props for {@link FilterPanel}. */
export interface FilterPanelProps {
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters?: () => void;
  labels: Required<TableLabels>;
  dir?: Direction;
  classNames: DataTableClassNames;
}

/** Backdrop + side drawer for caller-provided filter widgets. */
export function FilterPanel({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  dir = "ltr",
  classNames,
}: Readonly<FilterPanelProps>) {
  if (!open) return null;

  return (
    <>
      <button
        type="button"
        aria-label={labels.cancel}
        data-adapttable-part="filters-backdrop"
        className={cx(
          "adapttable-filters-backdrop",
          classNames.filtersBackdrop
        )}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={labels.filters}
        data-adapttable-part="filters-panel"
        data-dir={dir}
        className={cx("adapttable-filters-panel", classNames.filtersPanel)}
      >
        <header
          data-adapttable-part="filters-header"
          className={classNames.filtersHeader}
        >
          <h3
            data-adapttable-part="filters-title"
            className={classNames.filtersTitle}
          >
            {labels.filters}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
          </h3>
          <button
            type="button"
            aria-label={labels.cancel}
            data-adapttable-part="filters-close"
            className={classNames.filtersClose}
            onClick={onClose}
          >
            ×
          </button>
        </header>
        <div
          data-adapttable-part="filters-body"
          className={classNames.filtersBody}
        >
          {filters}
        </div>
        <footer
          data-adapttable-part="filters-footer"
          className={classNames.filtersFooter}
        >
          <button
            type="button"
            onClick={() => onClearFilters?.()}
            disabled={activeFilterCount === 0}
            data-adapttable-part="filters-clear"
            className={classNames.filtersClear}
          >
            {labels.clearAll}
          </button>
          <button
            type="button"
            onClick={onClose}
            data-adapttable-part="filters-done"
            className={classNames.filtersDone}
          >
            {labels.applyFilters}
          </button>
        </footer>
      </aside>
    </>
  );
}
