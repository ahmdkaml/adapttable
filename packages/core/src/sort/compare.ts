import type { SortableValue, SortDirection } from "../types";

/**
 * Compare two sortable primitives for ascending order. `null` /
 * `undefined` sort last. Numbers compare numerically; everything else
 * compares via locale-aware string comparison.
 *
 * @returns Negative if `a < b`, positive if `a > b`, `0` if equal.
 */
export function compareValues(a: SortableValue, b: SortableValue): number {
  if (a === b) return 0;
  if (a === null || a === undefined) return 1;
  if (b === null || b === undefined) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b));
}

/**
 * Return a new array sorted by the given value extractor and direction.
 * The sort is stable (input order is preserved for equal keys). The input
 * array is not mutated.
 *
 * @typeParam TRow - The row type.
 * @param rows - The rows to sort.
 * @param getValue - Extracts the comparison key for a row.
 * @param direction - Sort direction.
 * @returns A new, sorted array.
 */
export function sortRows<TRow>(
  rows: readonly TRow[],
  getValue: (row: TRow) => SortableValue,
  direction: SortDirection
): TRow[] {
  const factor = direction === "asc" ? 1 : -1;
  return [...rows]
    .map((row, index) => ({ row, index }))
    .sort((x, y) => {
      const cmp = compareValues(getValue(x.row), getValue(y.row));
      return cmp === 0 ? x.index - y.index : cmp * factor;
    })
    .map((entry) => entry.row);
}
