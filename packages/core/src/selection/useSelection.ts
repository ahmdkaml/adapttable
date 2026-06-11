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
  /**
   * Controlled selection. When provided, the hook reads from this value and
   * reports every change request through `onChange` instead of mutating its
   * own state — the same controlled/uncontrolled split as `useColumnLayout`.
   */
  selected?: readonly string[];
  /** Change handler; required for the controlled mode to update. */
  onChange?: (selectedIds: string[]) => void;
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
  selected,
  onChange,
}: UseSelectionOptions<TRow>): SelectionState {
  const [internal, setInternal] = useState<Set<string>>(() => new Set());
  const controlled = selected !== undefined;
  const selectedIds = useMemo(
    () => (selected === undefined ? internal : new Set(selected)),
    [selected, internal]
  );

  // The mutators below close over `commit`; reading the live mode/state
  // through this ref keeps their identities PERMANENTLY stable — memoized
  // adapter rows can hold `toggle` forever without computing from a stale
  // set in the controlled mode.
  const modeRef = useRef({ controlled, onChange, selectedIds });
  modeRef.current = { controlled, onChange, selectedIds };

  /** Route a change to the parent (controlled) or internal state. */
  const commit = useCallback(
    (compute: (prev: ReadonlySet<string>) => Set<string>) => {
      const live = modeRef.current;
      if (live.controlled) {
        live.onChange?.([...compute(live.selectedIds)]);
      } else {
        setInternal((prev) => compute(prev));
      }
    },
    []
  );

  // Clear on reset-key change, but not on first mount. The effect reads the
  // LATEST size through a ref so only `resetKey` retriggers it.
  const liveRef = useRef({ commit, size: selectedIds.size });
  liveRef.current = { commit, size: selectedIds.size };
  const firstRef = useRef(true);
  useEffect(() => {
    if (firstRef.current) {
      firstRef.current = false;
      return;
    }
    // Identity-preserving no-op when there is nothing to clear.
    if (liveRef.current.size === 0) return;
    liveRef.current.commit(() => new Set());
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

  const toggle = useCallback(
    (id: string) => {
      commit((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [commit]
  );

  const toggleAll = useCallback(() => {
    commit((prev) => {
      const next = new Set(prev);
      const allSelected =
        visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      for (const id of visibleIds) {
        if (allSelected) next.delete(id);
        else next.add(id);
      }
      return next;
    });
  }, [commit, visibleIds]);

  const clear = useCallback(() => commit(() => new Set()), [commit]);

  // Stable identity: row-level React.memo in the adapters depends on the
  // selection object only changing when the selection actually changes.
  return useMemo(
    () => ({
      selectedIds,
      selectedCount: selectedIds.size,
      headerState,
      isSelected,
      toggle,
      toggleAll,
      clear,
      visibleIds,
    }),
    [selectedIds, headerState, isSelected, toggle, toggleAll, clear, visibleIds]
  );
}
