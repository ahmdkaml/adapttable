import type { SortableValue } from "../types";
import { getPath } from "../utils/path";

/** One choice in a select cell editor. */
export interface CellEditorOption {
  value: string;
  label: string;
}

/**
 * Editor descriptor for an editable column — mirrors the declarative
 * `filter` shorthand: a bare type, or a select with options (objects or
 * plain value strings).
 */
export type CellEditor =
  | "text"
  | "number"
  | {
      type: "select";
      options: readonly CellEditorOption[] | readonly string[];
    };

/**
 * Minimal column surface the editing helpers need. {@link ColumnDef}
 * satisfies this; using a narrow shape avoids `ColumnDef<T>` variance
 * issues when Tab-navigation crosses generic boundaries.
 *
 * `editable` uses a bivariant callback (same pattern as React's event
 * handlers) so `ColumnDef<Person>` is assignable to `EditableColumnLike`.
 */
export interface EditableColumnLike<TRow = unknown> {
  key: string;
  editable?: boolean | { bivarianceHack(row: TRow): boolean }["bivarianceHack"];
  editor?: CellEditor;
  editValue?: { bivarianceHack(row: TRow): string }["bivarianceHack"];
  parseValue?: {
    bivarianceHack(draft: string, row: TRow): unknown;
  }["bivarianceHack"];
  validate?: {
    bivarianceHack(
      value: unknown,
      row: TRow
    ): string | undefined | Promise<string | undefined>;
  }["bivarianceHack"];
  sortValue?: { bivarianceHack(row: TRow): SortableValue }["bivarianceHack"];
}

/** The active cell being edited. */
export interface CellEditTarget {
  rowId: string;
  columnKey: string;
}

/** Result of a successful commit (host applies via `onCellEdit`). */
export interface CellEditCommit {
  rowId: string;
  columnKey: string;
  /** Raw draft string from the editor. */
  draft: string;
}

/** Normalize select options to `{ value, label }` pairs. */
export function normalizeEditorOptions(
  options: readonly CellEditorOption[] | readonly string[]
): CellEditorOption[] {
  return options.map((option) =>
    typeof option === "string" ? { value: option, label: option } : option
  );
}

/** Whether any column opts into editing (ignores per-row predicates). */
export function hasEditableColumns(
  columns: readonly EditableColumnLike[]
): boolean {
  return columns.some(
    (column) => column.editable !== undefined && column.editable !== false
  );
}

/** Whether a column is editable for a given row. */
export function isCellEditable<TRow>(
  column: EditableColumnLike<TRow>,
  row: TRow
): boolean {
  const flag = column.editable;
  if (flag === undefined || flag === false) return false;
  if (flag === true) return true;
  return flag(row);
}

/**
 * Resolve the editor for a column that opts into editing.
 * Returns `null` when the column is not editable — adapters must not
 * render an editor affordance without a non-null result AND a table-level
 * `onCellEdit` handler.
 */
export function resolveCellEditor(
  column: EditableColumnLike
): CellEditor | null {
  if (column.editable === undefined || column.editable === false) return null;
  return column.editor ?? "text";
}

/**
 * Stringify a cell's current value for the editor draft.
 * Prefers `editValue`, then `sortValue`, then `getPath(row, key)`.
 * Non-primitive path values yield `""` so we never seed `[object Object]`.
 */
export function readEditableCellValue<TRow>(
  row: TRow,
  column: EditableColumnLike<TRow>
): string {
  if (column.editValue) return column.editValue(row);
  if (column.sortValue) {
    return stringifyEditSeed(column.sortValue(row));
  }
  return stringifyEditSeed(getPath(row, column.key));
}

function stringifyEditSeed(value: unknown): string {
  if (value === null || value === undefined) return "";
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }
  return "";
}

/**
 * Parse a draft string into the value passed to `onCellEdit`.
 * Number editors yield `number | null` (empty / invalid → `null`);
 * select and text stay strings.
 */
export function parseCellEditValue(editor: CellEditor, draft: string): unknown {
  if (editor === "number") {
    const trimmed = draft.trim();
    if (trimmed === "") return null;
    const n = Number(trimmed);
    return Number.isFinite(n) ? n : null;
  }
  return draft;
}

/**
 * Find the next (or previous) editable cell in row-major order (wraps).
 * Returns `null` when no other editable cell exists.
 */
export function stepEditableCell<TRow>(options: {
  rows: readonly TRow[];
  columns: readonly EditableColumnLike<TRow>[];
  rowKey: (row: TRow) => string;
  from: CellEditTarget;
  /** `1` advances (Tab); `-1` goes previous (Shift+Tab). */
  direction?: 1 | -1;
}): CellEditTarget | null {
  const { rows, columns, rowKey, from, direction = 1 } = options;
  const editableCols = columns.filter(
    (c) => c.editable !== undefined && c.editable !== false
  );
  if (editableCols.length === 0 || rows.length === 0) return null;

  const rowIndex = rows.findIndex((r) => rowKey(r) === from.rowId);
  const colIndex = editableCols.findIndex((c) => c.key === from.columnKey);
  if (rowIndex < 0 || colIndex < 0) return null;

  const total = rows.length * editableCols.length;
  for (let step = 1; step < total; step++) {
    const flat =
      (((rowIndex * editableCols.length + colIndex + direction * step) %
        total) +
        total) %
      total;
    const nextRow = Math.floor(flat / editableCols.length);
    const nextCol = flat % editableCols.length;
    const row = rows[nextRow]!;
    const column = editableCols[nextCol]!;
    if (isCellEditable(column, row)) {
      return { rowId: rowKey(row), columnKey: column.key };
    }
  }
  return null;
}

/** Tab-advance form of {@link stepEditableCell}, fixed to `direction: 1`. */
export function nextEditableCell<TRow>(options: {
  rows: readonly TRow[];
  columns: readonly EditableColumnLike<TRow>[];
  rowKey: (row: TRow) => string;
  from: CellEditTarget;
}): CellEditTarget | null {
  return stepEditableCell({ ...options, direction: 1 });
}

/**
 * The row, the column and the parsed value a commit resolves to.
 *
 * Separate from applying it, because validation has to see the value BEFORE the
 * host does — the whole point of a validator is to stop the call.
 *
 * @typeParam TRow - The row type.
 * @param options - The commit and the page it addresses.
 * @returns The resolved triple, or `null` for a stale commit whose row or
 * column has since left the page.
 */
export function resolveCommitValue<TRow>(options: {
  commit: CellEditCommit;
  rows: readonly TRow[];
  columns: readonly EditableColumnLike<TRow>[];
  rowKey: (row: TRow) => string;
}): { row: TRow; column: EditableColumnLike<TRow>; value: unknown } | null {
  const row = options.rows.find(
    (r) => options.rowKey(r) === options.commit.rowId
  );
  const column = options.columns.find(
    (c) => c.key === options.commit.columnKey
  );
  if (!row || !column) return null;
  const editor = resolveCellEditor(column) ?? "text";
  // A column that states how to read its own drafts owns the conversion; the
  // editor's built-in parsing is the fallback, not an extra step on top.
  const value = column.parseValue
    ? column.parseValue(options.commit.draft, row)
    : parseCellEditValue(editor, options.commit.draft);
  return { row, column, value };
}

/**
 * Apply a commit through the host channel: resolve the row, parse the draft
 * with the column's editor, call `onCellEdit`. Returns `false` when the row
 * or column is missing (stale commit after a filter/page change).
 */
export function applyCellEditCommit<TRow>(options: {
  commit: CellEditCommit;
  rows: readonly TRow[];
  columns: readonly EditableColumnLike<TRow>[];
  rowKey: (row: TRow) => string;
  onCellEdit: (row: TRow, key: string, nextValue: unknown) => void;
}): boolean {
  const resolved = resolveCommitValue(options);
  if (!resolved) return false;
  options.onCellEdit(resolved.row, resolved.column.key, resolved.value);
  return true;
}
