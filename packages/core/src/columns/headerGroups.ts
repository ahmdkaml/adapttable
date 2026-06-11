import type { ColumnDef } from "../types";

/** One cell of the group header row. */
export interface HeaderGroupCell {
  /** Stable key for React lists. */
  key: string;
  /** Group label, or `null` for the gap over ungrouped columns. */
  label: string | null;
  /** How many leaf columns this cell spans. */
  span: number;
}

/**
 * Compute the grouped header row from the VISIBLE columns: contiguous runs
 * of the same `group` merge into one spanning cell; ungrouped columns get
 * unlabeled gap cells. Returns `null` when no visible column declares a
 * group (no second header row at all). Groups are adjacency-based on
 * purpose — if the user reorders columns apart, the group SPLITS rather
 * than lying about the layout.
 */
export function headerGroupRow<TRow>(
  columns: readonly ColumnDef<TRow>[]
): HeaderGroupCell[] | null {
  if (!columns.some((c) => c.group)) return null;
  const cells: HeaderGroupCell[] = [];
  for (const column of columns) {
    const label = column.group ?? null;
    const last = cells.at(-1);
    if (last?.label === label && label !== null) {
      last.span += 1;
    } else if (last?.label === null && label === null) {
      last.span += 1;
    } else {
      cells.push({
        key: `${label ?? "gap"}-${cells.length}`,
        label,
        span: 1,
      });
    }
  }
  return cells;
}
