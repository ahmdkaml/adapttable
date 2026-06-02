import type { SortableValue, SortDirection } from "../types";

/** `null` / `undefined` / `NaN` are unorderable and always sort last. */
function sortsLast(value: SortableValue): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "number" && Number.isNaN(value))
  );
}

/**
 * Compare two sortable primitives for ascending order. `null` / `undefined` /
 * `NaN` sort last. Numbers compare numerically; everything else compares via
 * locale-aware string comparison.
 *
 * @returns Negative if `a < b`, positive if `a > b`, `0` if equal.
 */
export function compareValues(a: SortableValue, b: SortableValue): number {
  if (a === b) return 0;
  if (sortsLast(a)) return 1;
  if (sortsLast(b)) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  if (typeof a === "boolean" && typeof b === "boolean") {
    return Number(a) - Number(b);
  }
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
    .map((row, index) => ({ row, index, value: getValue(row) }))
    .sort((x, y) => {
      // `null` / `undefined` / `NaN` always sort last, regardless of
      // direction — they must not be flipped to the top by a descending sort.
      const xNull = sortsLast(x.value);
      const yNull = sortsLast(y.value);
      if (xNull || yNull) {
        if (xNull && yNull) return x.index - y.index;
        return xNull ? 1 : -1;
      }
      const cmp = compareValues(x.value, y.value);
      return cmp === 0 ? x.index - y.index : cmp * factor;
    })
    .map((entry) => entry.row);
}
