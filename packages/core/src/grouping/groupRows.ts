import type { ReactNode } from "react";

import type { ColumnDef } from "../types";
import { getPath } from "../utils/path";

/**
 * One visual row in a single-level grouped body: a group header, or a leaf
 * data row belonging to a group. Adapters switch on `kind`.
 */
export type GroupedFlatEntry<TRow> =
  | {
      kind: "group";
      /** Stable id: `group:${keys}:${valueKeys}`, unique down the whole tree. */
      key: string;
      /** Raw group value (from sortValue / path). */
      value: unknown;
      /** Display label for the header (stringified value, or "(blank)"). */
      label: string;
      /**
       * Depth from zero. With one grouping key every header is level 0; with
       * `["team", "status"]` the status headers are level 1, and adapters
       * indent by it.
       */
      level: number;
      /** Which column this level groups by. */
      groupBy: string;
      /** The value keys from the root down to here — the node's address. */
      path: readonly string[];
      /**
       * EVERY leaf beneath this header, not just its direct children: a
       * parent's count, its aggregates and its selection state all describe
       * the whole subtree, which is what a person reading a nested group
       * expects a number beside it to mean.
       */
      leafRows: readonly TRow[];
      leafIds: readonly string[];
      /** Present when the host passed `groupAggregates`. */
      aggregateCells?: Partial<Record<string, ReactNode>>;
      collapsed: boolean;
    }
  | {
      kind: "row";
      key: string;
      row: TRow;
      /** Index among leaves in the flat model (stable for selection chrome). */
      index: number;
      groupKey: string;
    };

/** Same mapper signature as `summaryRow` — one API for page footer + groups. */
export type GroupAggregatesFn<TRow> = (
  rows: readonly TRow[]
) => Partial<Record<string, ReactNode>>;

export interface BuildGroupedFlatModelOptions<TRow> {
  /** Leaf rows to partition (frontend: prefer `allFilteredRows`). */
  rows: readonly TRow[];
  /**
   * Column key to group by, or an ordered list for nested grouping —
   * `["team", "status"]` puts each status inside its team.
   */
  groupBy: string | readonly string[];
  columns: readonly ColumnDef<TRow>[];
  getRowId: (row: TRow) => string;
  /** Collapsed group keys (from {@link useGroupCollapse}). */
  collapsedGroupIds: ReadonlySet<string>;
  /** Optional per-group cells — same shape as `summaryRow`. */
  aggregates?: GroupAggregatesFn<TRow>;
  /** Override blank-group label (default `"(blank)"`). */
  blankLabel?: string;
}

/**
 * Resolve the value used to bucket a row for `groupBy`. Prefers the column's
 * `sortValue` (same primitive as client sort), then a path lookup on the
 * column key — never the JSX accessor.
 */
export function resolveGroupValue<TRow>(
  row: TRow,
  groupBy: string,
  column: ColumnDef<TRow> | undefined
): unknown {
  if (column?.sortValue) return column.sortValue(row);
  const path = column?.key ?? groupBy;
  return getPath(row, path);
}

/**
 * Stable string key for a group bucket. Type-tagged so distinct values
 * never share a bucket across types — number `5` vs string `"5"`, boolean
 * `true` vs string `"true"`, a Date vs its own ISO string. Null-ish and
 * empty-string values deliberately share the one blank bucket (they all
 * render the same blank label; splitting them would show several
 * identical "(blank)" groups).
 */
export function groupValueKey(value: unknown): string {
  if (value == null || value === "") return "";
  if (typeof value === "string") return `s:${value}`;
  if (typeof value === "number" || typeof value === "bigint") {
    return `n:${String(value)}`;
  }
  if (typeof value === "boolean") return `b:${String(value)}`;
  if (value instanceof Date) return `d:${value.toISOString()}`;
  try {
    return `j:${JSON.stringify(value)}`;
  } catch {
    return `o:${Object.prototype.toString.call(value)}`;
  }
}

export function formatGroupLabel(
  value: unknown,
  blankLabel = "(blank)"
): string {
  if (value == null || value === "") return blankLabel;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  if (value instanceof Date) return value.toISOString();
  try {
    return JSON.stringify(value);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

/**
 * A group node's stable id.
 *
 * Both halves carry the whole path, so "Core > blocked" and "Web > blocked"
 * are different nodes — collapse one and the other stays open, which a key of
 * just the value could never express.
 *
 * @param keys - The grouping keys from the root down to this level.
 * @param valueKeys - The value keys down to this node.
 * @returns The id.
 */
export function makeGroupRowKey(
  keys: string | readonly string[],
  valueKeys: string | readonly string[]
): string {
  const k = typeof keys === "string" ? keys : keys.join(">");
  const v = typeof valueKeys === "string" ? valueKeys : valueKeys.join(">");
  return `group:${k}:${v}`;
}

/**
 * Partition leaf rows into the flat model adapters render: a group header,
 * then whatever sits under it — nested headers first when there is more than
 * one grouping key, then the leaves.
 *
 * Flat rather than nested on purpose: a windowing virtualizer can only measure
 * and slice a list, so the tree is expressed as depth on each entry instead of
 * as children. Group order follows first-seen value order within each parent,
 * which keeps the sort the source already applied.
 *
 * A collapsed header emits nothing beneath it — not its child headers and not
 * their leaves — so collapsing a top-level group hides the whole subtree in
 * one step.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link BuildGroupedFlatModelOptions}.
 * @returns The entries, in render order.
 */
export function buildGroupedFlatModel<TRow>(
  options: BuildGroupedFlatModelOptions<TRow>
): GroupedFlatEntry<TRow>[] {
  const {
    rows,
    groupBy,
    columns,
    getRowId,
    collapsedGroupIds,
    aggregates,
    blankLabel,
  } = options;
  const keys = (typeof groupBy === "string" ? [groupBy] : groupBy).filter(
    (key) => key.length > 0
  );
  if (keys.length === 0) return [];

  const flat: GroupedFlatEntry<TRow>[] = [];
  let leafIndex = 0;

  /** One level of the tree; recurses while grouping keys remain. */
  const walk = (
    subset: readonly TRow[],
    level: number,
    path: readonly string[]
  ): void => {
    const key = keys[level]!;
    const column = columns.find((c) => c.key === key);
    const order: string[] = [];
    const buckets = new Map<string, { value: unknown; rows: TRow[] }>();

    for (const row of subset) {
      const value = resolveGroupValue(row, key, column);
      const valueKey = groupValueKey(value);
      let bucket = buckets.get(valueKey);
      if (!bucket) {
        bucket = { value, rows: [] };
        buckets.set(valueKey, bucket);
        order.push(valueKey);
      }
      bucket.rows.push(row);
    }

    for (const valueKey of order) {
      const bucket = buckets.get(valueKey)!;
      const here = [...path, valueKey];
      const groupKey = makeGroupRowKey(keys.slice(0, level + 1), here);
      const collapsed = collapsedGroupIds.has(groupKey);

      flat.push({
        kind: "group",
        key: groupKey,
        value: bucket.value,
        label: formatGroupLabel(bucket.value, blankLabel),
        level,
        groupBy: key,
        path: here,
        leafRows: bucket.rows,
        leafIds: bucket.rows.map((row) => getRowId(row)),
        aggregateCells: aggregates?.(bucket.rows),
        collapsed,
      });
      if (collapsed) continue;

      if (level + 1 < keys.length) {
        walk(bucket.rows, level + 1, here);
        continue;
      }
      for (const row of bucket.rows) {
        flat.push({
          kind: "row",
          key: getRowId(row),
          row,
          index: leafIndex++,
          groupKey,
        });
      }
    }
  };

  walk(rows, 0, []);
  return flat;
}
