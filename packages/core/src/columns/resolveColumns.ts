import type { ColumnDef } from "../types";
import { humanizeKey } from "../utils/humanizeKey";
import { getPath } from "../utils/path";

/** Cell content from a dot-path value: primitives render, anything else does not. */
function pathCell(value: unknown): string | null {
  switch (typeof value) {
    case "string":
      return value;
    case "number":
    case "boolean":
    case "bigint":
      return String(value);
    default:
      return null;
  }
}

/**
 * Fill a column's declarative defaults: a missing `header` is humanized from
 * the key, and a column without `accessor`/`Cell` reads the row by `key` as
 * a dot path (`"department.name"`). Already-complete columns pass through
 * untouched, so the resolution is idempotent and cheap to repeat.
 */
export function resolveColumns<TRow>(
  columns: readonly ColumnDef<TRow>[]
): ColumnDef<TRow>[] {
  return columns.map((column) => {
    const needsHeader = column.header === undefined;
    const needsAccessor = !column.accessor && !column.Cell;
    if (!needsHeader && !needsAccessor) return column;
    return {
      ...column,
      header: needsHeader ? humanizeKey(column.key) : column.header,
      accessor: needsAccessor
        ? (row: TRow) => pathCell(getPath(row, column.key))
        : column.accessor,
    };
  });
}
