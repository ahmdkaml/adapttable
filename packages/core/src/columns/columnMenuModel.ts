import type { ColumnDef } from "../types";
import type { UseColumnLayoutResult } from "./useColumnLayout";
import { applyColumnOrder } from "./useColumnLayout";

/** Readable label for a column in the menu (header string → mobileLabel → key). */
export function columnMenuLabel<TRow>(column: ColumnDef<TRow>): string {
  if (typeof column.header === "string") return column.header;
  return column.mobileLabel ?? column.key;
}

/** Edge a column is pinned to, or `undefined` when unpinned. */
export type PinnedSide = "left" | "right" | undefined;

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

/** The next side in the pin cycle: none → left → right → none. */
export function nextPinSide(current: PinnedSide): PinnedSide {
  if (current === undefined) return "left";
  return current === "left" ? "right" : undefined;
}

/**
 * The label for the action that advances the pin cycle — what clicking the
 * pin control will DO next, so the accessible name always matches the
 * behaviour ("Pin left" → "Pin right" → "Unpin").
 */
export function pinActionLabel(
  current: PinnedSide,
  labels: { pinLeft: string; pinRight: string; unpin: string }
): string {
  if (current === undefined) return labels.pinLeft;
  return current === "left" ? labels.pinRight : labels.unpin;
}

/**
 * Build the column-menu rows in the table's real order — visible and hidden
 * columns interleaved exactly as they appear (hiding never reorders the list).
 * Shared so all five adapters render an identical model and only differ in kit
 * markup.
 */
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
