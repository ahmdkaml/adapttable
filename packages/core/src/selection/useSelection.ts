import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/** Tri-state of the "select all visible" header control. */
export type HeaderSelectionState = "all" | "some" | "none";

/** Options for {@link useSelection}. */
export interface UseSelectionOptions<TRow> {
  /** The currently visible rows. */
  rows: readonly TRow[];
  /** Stable id extractor for a row. */
  getId: (row: TRow) => string;
  /**
   * When this value changes, the selection is cleared (the previously
   * selected ids may no longer be visible). Compose it from search /
   * page / active-filter count — e.g. `` `${search}|${page}` ``.
   */
  resetKey?: unknown;
}

/** Selection state + actions returned by {@link useSelection}. */
export interface SelectionState {
  /** The set of selected ids. */
  selectedIds: ReadonlySet<string>;
  /** Number of selected ids. */
  selectedCount: number;
  /** Tri-state for the visible rows (`all` / `some` / `none`). */
  headerState: HeaderSelectionState;
  /** Whether a specific id is selected. */
  isSelected: (id: string) => boolean;
  /** Toggle a single id. */
  toggle: (id: string) => void;
  /** Toggle every visible id (select all, or clear all if already full). */
  toggleAll: () => void;
  /** Clear the entire selection. */
  clear: () => void;
  /** The visible ids, in row order. */
  visibleIds: string[];
}

/**
 * Headless multi-row selection. Tracks a set of ids, derives the header
 * tri-state from the visible rows, and clears itself when `resetKey`
 * changes so stale ids never linger after a filter/page change.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link UseSelectionOptions}.
 * @returns Selection state and actions.
 */
export function useSelection<TRow>({
  rows,
  getId,
  resetKey,
}: UseSelectionOptions<TRow>): SelectionState {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  // Clear on reset-key change, but not on first mount.
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    setSelectedIds((prev) => (prev.size === 0 ? prev : new Set()));
  }, [resetKey]);

  const visibleIds = useMemo(() => rows.map(getId), [rows, getId]);

  const selectedVisible = useMemo(
    () => visibleIds.reduce((n, id) => (selectedIds.has(id) ? n + 1 : n), 0),
    [visibleIds, selectedIds]
  );

  let headerState: HeaderSelectionState = "none";
  if (visibleIds.length > 0 && selectedVisible === visibleIds.length) {
    headerState = "all";
  } else if (selectedVisible > 0) {
    headerState = "some";
  }

  const isSelected = useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  const toggle = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      for (const id of visibleIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, [visibleIds]);

  const clear = useCallback(() => setSelectedIds(new Set()), []);

  return {
    selectedIds,
    selectedCount: selectedIds.size,
    headerState,
    isSelected,
    toggle,
    toggleAll,
    clear,
    visibleIds,
  };
}
