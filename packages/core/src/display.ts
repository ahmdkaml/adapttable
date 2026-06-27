import type { ColumnDef } from "./types";

/**
 * Kit-independent display helpers shared by every adapter's table chrome —
 * logical alignment and the sort-indicator glyph. Centralising them keeps the
 * adapters' render files from duplicating the same pure logic.
 */

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
