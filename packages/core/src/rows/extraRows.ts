/**
 * Full-width and separator rows — host-injected slots between data rows.
 *
 * Grouping already speaks in `kind`s. These two join that vocabulary so a
 * kit maps one list: a separator is a thin rule, a full-width row is one
 * cell spanning the table. Omit `extraRows` and nothing is inserted.
 *
 * Position is `beforeRowId` (a data-row id). Omit it to append after the
 * last data row. Several extras sharing a target keep the host's order.
 *
 * Extras are content, not table state — nothing goes in the URL. Mobile
 * cards keep the same slots: a rule between cards, or a full-width note.
 */
import type { ReactNode } from "react";

/** What the host may inject. */
export type ExtraRowKind = "separator" | "fullWidth";

/** One host-injected slot. */
export interface ExtraRow {
  /** Stable id — also the React key. */
  key: string;
  kind: ExtraRowKind;
  /**
   * Insert immediately before this data row. Omit to append after the
   * last data row in the list being interleaved.
   */
  beforeRowId?: string;
  /** Full-width body. Ignored on a separator. */
  render?: () => ReactNode;
}

/** A separator or full-width entry in a `kind`-tagged body list. */
export type ExtraEntry =
  | { kind: "separator"; key: string }
  | { kind: "fullWidth"; key: string; render?: () => ReactNode };

/** Narrow a body slot to a host-injected extra. */
export function isExtraEntry(entry: object): entry is ExtraEntry {
  if (!("kind" in entry)) return false;
  const kind = (entry as { kind?: unknown }).kind;
  return kind === "separator" || kind === "fullWidth";
}

/** True when the host asked for any extra slot. */
export function extraRowsArmed(
  extraRows: readonly ExtraRow[] | undefined
): boolean {
  return Boolean(extraRows && extraRows.length > 0);
}

function toEntry(extra: ExtraRow): ExtraEntry {
  if (extra.kind === "separator") return { kind: "separator", key: extra.key };
  return { kind: "fullWidth", key: extra.key, render: extra.render };
}

/**
 * Splice extras into a `kind`-tagged list. `dataKey` names the data row
 * an entry represents — group headers return `undefined` and are never
 * a splice target.
 */
export function insertExtraRows<T extends { key: string }>(
  entries: readonly T[],
  extraRows: readonly ExtraRow[] | undefined,
  dataKey: (entry: T) => string | undefined
): readonly (T | ExtraEntry)[] {
  if (!extraRows || extraRows.length === 0) return entries;
  const before = new Map<string, ExtraRow[]>();
  const append: ExtraRow[] = [];
  for (const extra of extraRows) {
    if (extra.beforeRowId === undefined) {
      append.push(extra);
      continue;
    }
    const bucket = before.get(extra.beforeRowId) ?? [];
    bucket.push(extra);
    before.set(extra.beforeRowId, bucket);
  }
  const result: (T | ExtraEntry)[] = [];
  for (const entry of entries) {
    const id = dataKey(entry);
    if (id !== undefined) {
      const waiting = before.get(id);
      if (waiting) {
        for (const extra of waiting) result.push(toEntry(extra));
        before.delete(id);
      }
    }
    result.push(entry);
  }
  for (const extra of append) result.push(toEntry(extra));
  return result;
}

/** Part names every kit stamps on an extra row. */
export const EXTRA_ROW_PARTS = {
  separator: { row: "separator-row", cell: "separator-cell" },
  fullWidth: { row: "full-width-row", cell: "full-width-cell" },
} as const;
