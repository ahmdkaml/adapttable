import type { ColumnDef } from "../types";

/** Which layout a table is rendering in. */
export type TableLayout = "desktop" | "mobile";

/**
 * Resolve the columns visible for a layout.
 *
 * - Desktop: drops `hideOnDesktop` columns.
 * - Mobile: drops `hideOnMobile` columns, but the first three declared
 *   (desktop-visible) columns always surface so every card keeps a
 *   minimum identity block.
 *
 * @typeParam TRow - The row type.
 * @param columns - All declared columns.
 * @param layout - The current layout.
 * @returns The columns to render, in declared order.
 */
export function visibleColumns<TRow>(
  columns: readonly ColumnDef<TRow>[],
  layout: TableLayout
): ColumnDef<TRow>[] {
  const desktopVisible = columns.filter((c) => !c.hideOnDesktop);
  if (layout === "desktop") return desktopVisible;
  const alwaysShow = new Set(desktopVisible.slice(0, 3).map((c) => c.key));
  return desktopVisible.filter((c) => alwaysShow.has(c.key) || !c.hideOnMobile);
}
