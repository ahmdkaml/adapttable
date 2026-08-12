import type { CSSProperties } from "react";

import {
  edgePinStyle,
  type PinLeads,
  pinnedCellStyle,
  type PinOffset,
  type PinSide,
} from "./columns/useColumnLayout";
import type { ColumnDef } from "./types";

/**
 * Kit-independent display helpers shared by every adapter's table chrome —
 * logical alignment, the sort-indicator glyph, sticky pinned-cell styles, and
 * the row-memo guard. Centralising them keeps the adapters' render files from
 * duplicating the same pure logic.
 */

/**
 * Pinned data-cell sticky style with an opaque `background` so scrolled columns
 * don't bleed through the pinned ones. Adapters pass their kit's surface
 * background token as `bg`; a raw `style` object keeps the pixel insets the
 * core layout computes from being mangled by a kit's prop-to-spacing scale.
 */
export function pinnedDataCellStyle(
  pin: PinOffset | undefined,
  z: number,
  leads: PinLeads,
  bg: string
): CSSProperties | undefined {
  const style = pinnedCellStyle(pin, z, leads);
  return style ? { ...style, background: bg } : undefined;
}

/**
 * Sticky style for a non-data edge cell (expand chevron, selection, actions):
 * flush to its side when a data column on that side is pinned. `shift` insets a
 * left-edge cell past the leading expansion column so the chevron and the
 * selection checkbox pin side by side.
 */
export function pinnedEdgeCellStyle(
  side: PinSide,
  active: boolean,
  z: number,
  bg: string,
  shift = 0
): CSSProperties | undefined {
  const pin = edgePinStyle(side, active, z);
  if (!pin) return undefined;
  const style: CSSProperties = { ...pin, background: bg };
  if (shift > 0) style.insetInlineStart = shift;
  return style;
}

/**
 * The row-prop keys (other than the kit's own accent token) that change a
 * desktop row's visuals — the memo guard re-renders a row only when one of
 * these differs. Each adapter appends its theming key (`accentColor`)
 * to this shared base.
 */
export const SHARED_DESKTOP_ROW_KEYS = [
  "row",
  "id",
  "index",
  "selected",
  "expanded",
  "size",
  "dir",
  "columns",
  "columnWidths",
  "pinSignature",
  "className",
  "labels",
  "hasSelection",
  "expandable",
  "showActions",
  "hasRowClick",
  "columnSpan",
  // Cell focus and the selected range live here too, or a row never learns that
  // one of its cells became focused or selected. Omitting it is why the range
  // was invisible after 2.2.0: the live region announced the new cell (it sits
  // outside the memo) while every row kept its previous render, so no cell ever
  // showed `data-cell-selected`. The state object is memoized as a whole, so
  // this compares one reference and changes only when focus or the range does.
  "gridFocus",
] as const;

/** Shallow-equal two objects across a fixed key set (the row-memo guard). */
export function shallowEqualByKeys<T>(
  keys: readonly (keyof T)[],
  prev: Readonly<T>,
  next: Readonly<T>
): boolean {
  return keys.every((key) => prev[key] === next[key]);
}

/**
 * Map a column's logical alignment onto the `"start" | "center" | "end"`
 * value every kit's cell/justify prop accepts. `undefined` defaults to start.
 */
export function logicalAlign(
  align: ColumnDef<unknown>["align"]
): "start" | "center" | "end" {
  if (align === "center") return "center";
  if (align === "end") return "end";
  return "start";
}

/**
 * Header sort indicator text derived from a cell's computed sort state
 * (`aria-sort` value): `↑` ascending, `↓` descending, `↕` unsorted. Kits that
 * render the bare arrows as emoji (e.g. Radix Themes' font) append a
 * text-presentation selector on top of this base string.
 */
export function sortArrow(sort: unknown): string {
  if (sort === "ascending") return " ↑";
  if (sort === "descending") return " ↓";
  return " ↕";
}

/**
 * Is this cell inside the selected range?
 *
 * Core marks a selected cell with `data-cell-selected` through
 * `gridFocus.getCellProps`, but it cannot colour it: a selection has to look
 * like the kit it lives in, and a hard-coded blue would be wrong in seven of
 * eight. So core answers the question and each adapter answers it with its own
 * theme token — the same division as {@link pinnedDataCellStyle}, which takes
 * the kit's surface colour as an argument.
 *
 * Without this the range was invisible: the attribute reached the DOM in 2.2.0
 * and no adapter styled it, so a user extending a selection saw nothing move.
 *
 * @param props - The props from `getCellProps` / `getCellPropsAt`, or nothing.
 * @returns Whether the cell should render as selected.
 */
export function isSelectedCell(
  props: Readonly<Record<string, unknown>> | undefined
): boolean {
  return props?.["data-cell-selected"] !== undefined;
}

/**
 * The caption a mobile card shows beside a cell's value.
 *
 * A card is a list of label/value pairs, not a grid with a header row, so each
 * value has to carry its own caption. `mobileLabel` sets it; an **empty string**
 * deliberately removes it, which is how a card shows a bare value (an avatar, a
 * title line) with no caption above it. Without one, a string `header` is the
 * caption and the column's key is the last resort.
 *
 * Every adapter's card layout resolves this the same way, and it lives here
 * because seven of them once each had their own copy under two different names.
 *
 * @typeParam TRow - The row type.
 * @param column - The column being rendered in a card.
 * @returns The caption, or `undefined` when the card should show none.
 */
export function resolveMobileLabel<TRow>(
  column: ColumnDef<TRow>
): string | undefined {
  if (column.mobileLabel !== undefined) return column.mobileLabel || undefined;
  return typeof column.header === "string" ? column.header : column.key;
}
