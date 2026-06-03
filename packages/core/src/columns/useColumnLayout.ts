import { useCallback, useMemo, useState } from "react";

import type { ColumnDef } from "../types";

/**
 * User-driven column layout: which columns are hidden, their order, pinning,
 * and widths. Keyed by column `key`. Empty `order` means "declared order".
 *
 * Visibility is implemented now (Phase 1); `pinned`/`widths`/`order` mutation
 * land in later phases but the shape is fixed so persisted state is stable.
 */
export interface ColumnLayoutState {
  /** Column keys hidden by the user. */
  hidden: readonly string[];
  /** Explicit column order by key; empty falls back to declared order. */
  order: readonly string[];
  /** Per-column edge pinning. */
  pinned: Readonly<Record<string, "left" | "right">>;
  /** Per-column pixel widths. */
  widths: Readonly<Record<string, number>>;
}

/** An empty layout — declared order, nothing hidden/pinned/resized. */
export const EMPTY_COLUMN_LAYOUT: ColumnLayoutState = {
  hidden: [],
  order: [],
  pinned: {},
  widths: {},
};

/** Options for {@link useColumnLayout}. */
export interface UseColumnLayoutOptions<TRow> {
  /** All declared columns (already filtered for the current device layout). */
  columns: readonly ColumnDef<TRow>[];
  /** Controlled layout state. Omit for uncontrolled (internal) state. */
  layout?: ColumnLayoutState;
  /** Change handler; required for the controlled mode to update. */
  onLayoutChange?: (next: ColumnLayoutState) => void;
  /** Initial layout for the uncontrolled mode. */
  defaultLayout?: Partial<ColumnLayoutState>;
}

/** Result of {@link useColumnLayout}. */
export interface UseColumnLayoutResult<TRow> {
  /** The current layout state (controlled value or internal). */
  state: ColumnLayoutState;
  /** Declared columns reordered then filtered by the user's hidden set. */
  visibleColumns: ColumnDef<TRow>[];
  /** Whether a column key is currently hidden. */
  isHidden: (key: string) => boolean;
  /** Show/hide a single column. */
  setHidden: (key: string, hidden: boolean) => void;
  /** Toggle a single column's visibility. */
  toggleVisible: (key: string) => void;
  /** Restore the empty layout (all visible, declared order). */
  reset: () => void;
}

/** Order `columns` by an explicit key order, appending any unlisted columns. */
function applyOrder<TRow>(
  columns: readonly ColumnDef<TRow>[],
  order: readonly string[]
): ColumnDef<TRow>[] {
  if (order.length === 0) return [...columns];
  const byKey = new Map(columns.map((c) => [c.key, c]));
  const ordered: ColumnDef<TRow>[] = [];
  for (const key of order) {
    const col = byKey.get(key);
    if (col) {
      ordered.push(col);
      byKey.delete(key);
    }
  }
  // Columns not named in `order` keep their declared order at the end.
  for (const col of columns) if (byKey.has(col.key)) ordered.push(col);
  return ordered;
}

/**
 * Headless column-layout state. Uncontrolled by default; pass `layout` +
 * `onLayoutChange` to control it (and persist however you like — localStorage,
 * URL, server). Returns the reordered, visibility-filtered columns to render.
 *
 * @typeParam TRow - The row type.
 */
export function useColumnLayout<TRow>({
  columns,
  layout,
  onLayoutChange,
  defaultLayout,
}: UseColumnLayoutOptions<TRow>): UseColumnLayoutResult<TRow> {
  const [internal, setInternal] = useState<ColumnLayoutState>(() => ({
    ...EMPTY_COLUMN_LAYOUT,
    ...defaultLayout,
  }));
  const state = layout ?? internal;

  const commit = useCallback(
    (next: ColumnLayoutState) => {
      if (layout === undefined) setInternal(next);
      onLayoutChange?.(next);
    },
    [layout, onLayoutChange]
  );

  const isHidden = useCallback(
    (key: string) => state.hidden.includes(key),
    [state.hidden]
  );

  const setHidden = useCallback(
    (key: string, hidden: boolean) => {
      const has = state.hidden.includes(key);
      if (has === hidden) return;
      const nextHidden = hidden
        ? [...state.hidden, key]
        : state.hidden.filter((k) => k !== key);
      commit({ ...state, hidden: nextHidden });
    },
    [commit, state]
  );

  const toggleVisible = useCallback(
    (key: string) => setHidden(key, !state.hidden.includes(key)),
    [setHidden, state.hidden]
  );

  const reset = useCallback(() => commit(EMPTY_COLUMN_LAYOUT), [commit]);

  const visibleColumns = useMemo(
    () =>
      applyOrder(columns, state.order).filter(
        (c) => !state.hidden.includes(c.key)
      ),
    [columns, state.order, state.hidden]
  );

  return {
    state,
    visibleColumns,
    isHidden,
    setHidden,
    toggleVisible,
    reset,
  };
}
