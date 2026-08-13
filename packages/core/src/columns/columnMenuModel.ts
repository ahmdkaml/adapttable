import type { ColumnDef } from "../types";
import type { PinSide, UseColumnLayoutResult } from "./useColumnLayout";
import { applyColumnOrder } from "./useColumnLayout";

/** Readable label for a column in the menu (header string → mobileLabel → key). */
export function columnMenuLabel<TRow>(column: ColumnDef<TRow>): string {
  if (typeof column.header === "string") return column.header;
  return column.mobileLabel ?? column.key;
}

/** Edge a column is pinned to, or `undefined` when unpinned. */
export type PinnedSide = PinSide | undefined;

/** One row of the column-management menu, with its derived display state. */
export interface ColumnMenuRow<TRow> {
  column: ColumnDef<TRow>;
  key: string;
  name: string;
  /** Hidden columns keep their position; only the eye toggles. */
  hidden: boolean;
  /** Edge the column is pinned to, or `undefined` when unpinned. */
  pinned: PinnedSide;
  /** Index in the full column order (visible + hidden) — the reorder target. */
  index: number;
}

/**
 * Toggle a DATA column's start pin: none ↔ start (`"start"` = the logical
 * inline-start edge, which is the right edge under `dir="rtl"`). Data columns
 * never pin to the END edge — that is reserved for the trailing actions column,
 * which has its own end-pin toggle. Pinning a leading data column to the
 * trailing edge has no value: it just sticky-travels across the row and
 * collides with the actions column.
 */
export function nextPinSide(current: PinnedSide): PinnedSide {
  return current === undefined ? "start" : undefined;
}

/**
 * The label for a data column's pin toggle — "Pin to start" when unpinned,
 * "Unpin" when pinned — so the accessible name always matches what the click
 * will do. (The actions column uses its own "Pin to end" / "Unpin" label.)
 */
export function pinActionLabel(
  current: PinnedSide,
  labels: { pinStart: string; unpin: string }
): string {
  return current === undefined ? labels.pinStart : labels.unpin;
}

/**
 * Build the column-menu rows in the table's real order — visible and hidden
 * columns interleaved exactly as they appear (hiding never reorders the list).
 * Shared so all five adapters render an identical model and only differ in kit
 * markup.
 */
/**
 * Reserved layout key for the injected row-actions column. It is not a
 * `ColumnDef`, but the layout state treats keys opaquely, so the actions
 * column hides (`hidden: ["actions"]`) and end-pins
 * (`pinned: { actions: "end" }`) like any data column — adapters list it
 * in the Columns menu with a visibility toggle and an end-pin toggle (no
 * reorder/resize; it always trails).
 */
export const ACTIONS_COLUMN_KEY = "actions";

/**
 * Reserved layout key for the injected row-reorder column. Same deal as
 * {@link ACTIONS_COLUMN_KEY}: not a `ColumnDef`, but hideable and
 * start-pinnable through the layout because the key is just a string.
 */
export const REORDER_COLUMN_KEY = "reorder";

export function columnMenuRows<TRow>(
  allColumns: readonly ColumnDef<TRow>[],
  layout: UseColumnLayoutResult<TRow>
): ColumnMenuRow<TRow>[] {
  return applyColumnOrder(allColumns, layout.state.order).map(
    (column, index) => ({
      column,
      key: column.key,
      name: columnMenuLabel(column),
      hidden: layout.isHidden(column.key),
      pinned: layout.state.pinned[column.key],
      index,
    })
  );
}

/**
 * Labels every adapter's column menu needs (pre-translated by the caller).
 * Hoisted here so the five adapters share one contract instead of
 * re-declaring it.
 */
export interface ColumnMenuLabels {
  columns: string;
  pinStart: string;
  pinEnd: string;
  unpin: string;
  moveStart: string;
  moveEnd: string;
  resetColumns: string;
  /** "Size columns to content" — the menu's auto-size action. */
  autoSizeColumns: string;
  showColumn: string;
  hideColumn: string;
}

/** The shared prop surface of every adapter's `<ColumnMenu>`. */
export interface ColumnMenuChromeProps<TRow> {
  /** All declared columns (pre layout filtering). */
  allColumns: ColumnDef<TRow>[];
  /** The user column-layout state + mutators. */
  layout: UseColumnLayoutResult<TRow>;
  /** Resolved labels. */
  labels: ColumnMenuLabels;
}
