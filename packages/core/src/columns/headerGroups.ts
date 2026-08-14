import type { ColumnDef } from "../types";

/** Path separator inside a column-group id — labels may contain `/`. */
export const COLUMN_GROUP_ID_SEP = "\u001f";

/** One cell of a group header row. */
export interface HeaderGroupCell {
  /** Stable key for React lists. */
  key: string;
  /** Group label, or `null` for the gap over ungrouped columns. */
  label: string | null;
  /** How many leaf columns this cell spans. */
  span: number;
  /**
   * Stable id of this group (`path.join(COLUMN_GROUP_ID_SEP)`).
   * `null` on a gap cell.
   */
  id: string | null;
  /** True when this group is collapsed to its summary column. */
  collapsed: boolean;
  /** True when the host armed collapse and this cell is a real group. */
  collapsible: boolean;
}

/** `column.group` as a root-to-leaf path. A string is one level. */
export function columnGroupPath<TRow>(
  column: Pick<ColumnDef<TRow>, "group">
): readonly string[] {
  if (column.group === undefined) return [];
  return typeof column.group === "string" ? [column.group] : column.group;
}

/** Stable id for a group path. */
export function columnGroupId(path: readonly string[]): string {
  return path.join(COLUMN_GROUP_ID_SEP);
}

/**
 * Hide every leaf under a collapsed group except the first — that first
 * leaf is the summary column. Adjacency still decides who is in the group:
 * a column reordered out is no longer under the id, so it stays visible.
 */
export function applyCollapsedColumnGroups<TRow>(
  columns: readonly ColumnDef<TRow>[],
  collapsedIds: readonly string[]
): readonly ColumnDef<TRow>[] {
  if (collapsedIds.length === 0) return columns;
  const collapsed = new Set(collapsedIds);
  const seen = new Set<string>();
  return columns.filter((column) => {
    const path = columnGroupPath(column);
    const active = new Set(
      path.map((_, index) => columnGroupId(path.slice(0, index + 1)))
    );
    for (const id of seen) {
      if (!active.has(id)) seen.delete(id);
    }
    for (let depth = 1; depth <= path.length; depth += 1) {
      const id = columnGroupId(path.slice(0, depth));
      if (!collapsed.has(id)) continue;
      if (seen.has(id)) return false;
      seen.add(id);
    }
    return true;
  });
}

/** Add or drop a group id in the collapsed set. */
export function toggleCollapsedColumnGroup(
  collapsedIds: readonly string[],
  id: string
): string[] {
  return collapsedIds.includes(id)
    ? collapsedIds.filter((one) => one !== id)
    : [...collapsedIds, id];
}

/**
 * Every group-header row, top level first. Returns `null` when no visible
 * column declares a group. Contiguous same-path cells merge; a reorder that
 * breaks adjacency splits the group rather than teleporting it.
 */
export function headerGroupRows<TRow>(
  columns: readonly ColumnDef<TRow>[],
  collapsedIds: readonly string[] = [],
  collapsible = false
): HeaderGroupCell[][] | null {
  const paths = columns.map((column) => columnGroupPath(column));
  const maxDepth = paths.reduce((max, path) => Math.max(max, path.length), 0);
  if (maxDepth === 0) return null;
  const collapsed = new Set(collapsedIds);
  const rows: HeaderGroupCell[][] = [];
  for (let depth = 0; depth < maxDepth; depth += 1) {
    const cells: HeaderGroupCell[] = [];
    for (let index = 0; index < columns.length; index += 1) {
      const path = paths[index] ?? [];
      const label = path[depth] ?? null;
      const id =
        label === null ? null : columnGroupId(path.slice(0, depth + 1));
      const last = cells.at(-1);
      if (last?.label === label && last.id === id) {
        last.span += 1;
        continue;
      }
      cells.push({
        key: `${id ?? "gap"}-${depth}-${cells.length}`,
        label,
        span: 1,
        id,
        collapsed: id !== null && collapsed.has(id),
        collapsible: collapsible && id !== null,
      });
    }
    rows.push(cells);
  }
  return rows;
}

/**
 * The top group-header row. `null` when no visible column declares a group.
 * Groups are adjacency-based — if the user reorders columns apart, the
 * group SPLITS rather than lying about the layout.
 */
export function headerGroupRow<TRow>(
  columns: readonly ColumnDef<TRow>[]
): HeaderGroupCell[] | null {
  return headerGroupRows(columns)?.[0] ?? null;
}
