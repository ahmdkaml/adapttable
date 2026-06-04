import type { Direction, TableLabels } from "@adapttable/core";
import { type ReactNode, useEffect, useRef } from "react";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

/** Props for {@link FilterPopover}. */
export interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters?: () => void;
  labels: Required<TableLabels>;
  dir?: Direction;
  classNames: DataTableClassNames;
  /** The Filters trigger button — the popover anchors beneath it. */
  children: ReactNode;
}

/**
 * Anchored filter card (the default filter container). Opens beneath the
 * Filters button with NO backdrop — the background stays visible and
 * interactive; clicking outside the popover/anchor or pressing Escape closes
 * it. This is the plain-DOM mirror of the Mantine reference; pair with
 * `filtersMode="drawer"` for the slide-in panel (`FilterPanel`) instead.
 */
export function FilterPopover({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  dir = "ltr",
  classNames,
  children,
}: Readonly<FilterPopoverProps>) {
  // Keep the latest onClose without re-running the close effect on every
  // parent render.
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const rootRef = useRef<HTMLSpanElement>(null);

  // No scrim: close on outside-click (mousedown outside the anchor/popover) or
  // Escape, exactly like ColumnMenu — the background stays interactive.
  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node))
        onCloseRef.current();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // RTL flips which edge the card aligns to: anchor to the inline-start so it
  // stays under the button on both writing directions.
  const side = dir === "rtl" ? { left: 0 } : { right: 0 };

  return (
    <span
      ref={rootRef}
      data-adapttable-part="filters-anchor"
      className={cx("adapttable-filters-anchor", classNames.filtersAnchor)}
      style={{ position: "relative", display: "inline-flex" }}
    >
      {children}
      {open && (
        <div
          data-adapttable-part="filters-popover"
          data-dir={dir}
          className={cx(
            "adapttable-filters-popover",
            classNames.filtersPopover
          )}
          style={{ position: "absolute", top: "100%", zIndex: 200, ...side }}
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
              onClick={() => onClearFilters?.()}
              disabled={activeFilterCount === 0}
              data-adapttable-part="filters-clear"
              className={classNames.filtersClear}
            >
              {labels.clearAll}
            </button>
          </header>
          <div
            data-adapttable-part="filters-body"
            className={classNames.filtersBody}
          >
            {filters}
          </div>
        </div>
      )}
    </span>
  );
}
