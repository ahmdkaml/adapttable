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
  /** Pin a column to an edge, or unpin it with `undefined`. */
  setPinned: (key: string, side: "left" | "right" | undefined) => void;
  /** Move a column to a new index among the visible columns. */
  move: (key: string, toIndex: number) => void;
  /** Set (or clear, with `undefined`) a column's pixel width. */
  setWidth: (key: string, width: number | undefined) => void;
  /** Sticky inset (px) for a pinned column, by side. `undefined` if unpinned. */
  pinOffset: (
    key: string
  ) => { side: "left" | "right"; inset: number } | undefined;
  /** Restore the empty layout (all visible, declared order). */
  reset: () => void;
}

/** Minimal sticky-positioning style for a pinned cell, from a pin offset. */
export interface PinnedCellStyle {
  position: "sticky";
  left?: number;
  right?: number;
  zIndex: number;
}

/**
 * Build the sticky style for a pinned header/body cell from its pin offset.
 * Adapters spread this onto the cell and add their own opaque background.
 * Returns undefined for an unpinned cell.
 */
export function pinnedCellStyle(
  offset: { side: "left" | "right"; inset: number } | undefined,
  zIndex = 1
): PinnedCellStyle | undefined {
  if (!offset) return undefined;
  return { position: "sticky", [offset.side]: offset.inset, zIndex };
}

/** Order `columns` by an explicit key order, appending any unlisted columns. */
export function applyColumnOrder<TRow>(
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

  const setPinned = useCallback(
    (key: string, side: "left" | "right" | undefined) => {
      const next = { ...state.pinned };
      if (side === undefined) delete next[key];
      else next[key] = side;
      commit({ ...state, pinned: next });
    },
    [commit, state]
  );

  const setWidth = useCallback(
    (key: string, width: number | undefined) => {
      const next = { ...state.widths };
      if (width === undefined) delete next[key];
      else next[key] = width;
      commit({ ...state, widths: next });
    },
    [commit, state]
  );

  const visibleColumns = useMemo(
    () =>
      applyColumnOrder(columns, state.order).filter(
        (c) => !state.hidden.includes(c.key)
      ),
    [columns, state.order, state.hidden]
  );

  const move = useCallback(
    (key: string, toIndex: number) => {
      // Operate on the FULL ordered list (visible + hidden) so hiding a column
      // never reorders the rest and reordering keeps hidden columns in place.
      const current = applyColumnOrder(columns, state.order).map((c) => c.key);
      const from = current.indexOf(key);
      if (from === -1) return;
      const clamped = Math.max(0, Math.min(toIndex, current.length - 1));
      if (from === clamped) return;
      current.splice(from, 1);
      current.splice(clamped, 0, key);
      commit({ ...state, order: current });
    },
    [commit, state, columns]
  );

  const reset = useCallback(() => commit(EMPTY_COLUMN_LAYOUT), [commit]);

  const pinOffset = useCallback(
    (key: string) => {
      const side = state.pinned[key];
      if (!side) return undefined;
      const resolveWidth = (k: string): number => {
        if (typeof state.widths[k] === "number") return state.widths[k];
        const declared = columns.find((c) => c.key === k)?.width;
        if (typeof declared === "number") return declared;
        if (typeof declared === "string") {
          // Only pixel (or unit-less) widths can be summed into a sticky
          // inset; relative units (%, rem, fr, …) have no px value here, so
          // `parseInt("50%")` → 50 would corrupt the offset. Fall back instead.
          if (/^\d+(?:\.\d+)?(?:px)?$/.test(declared.trim())) {
            return Number.parseFloat(declared);
          }
        }
        return 150;
      };
      const samePinned = visibleColumns.filter(
        (c) => state.pinned[c.key] === side
      );
      const idx = samePinned.findIndex((c) => c.key === key);
      // Left: sum widths before this column; right: sum widths after it.
      const preceding =
        side === "left" ? samePinned.slice(0, idx) : samePinned.slice(idx + 1);
      const inset = preceding.reduce((sum, c) => sum + resolveWidth(c.key), 0);
      return { side, inset };
    },
    [columns, state.pinned, state.widths, visibleColumns]
  );

  return {
    state,
    visibleColumns,
    isHidden,
    setHidden,
    toggleVisible,
    setPinned,
    move,
    setWidth,
    pinOffset,
    reset,
  };
}
