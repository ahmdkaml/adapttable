import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import type { ColumnDef } from "../types";
import {
  type CellEditCommit,
  type CellEditor,
  type EditableColumnLike,
  isCellEditable,
  normalizeEditorOptions,
  resolveCellEditor,
  resolveCommitValue,
} from "./cellEditing";
import {
  beginCellEdit as beginEdit,
  type CellEditingState,
} from "./useCellEditing";
import type { CellValidator, EditValidationState } from "./validation";

/** Opt-in editing bundle from {@link TableChrome.editing}. */
export interface EditableCellEditing<TRow> {
  onCellEdit: (row: TRow, key: string, nextValue: unknown) => void;
  state: CellEditingState;
  /**
   * Validation, when the host declared any. A commit runs the validators first
   * and is dropped if one rejects — the editor stays open with the message on
   * it, so the reader fixes what they typed instead of losing it.
   */
  validation?: EditValidationState<TRow>;
}

/** Display / edit mode for one cell. */
export type EditableCellMode = "display" | "activatable" | "editing";

/** Controller returned by {@link editableCellController}. */
export interface EditableCellController {
  mode: EditableCellMode;
  /** The validator's message for this cell, if it rejected the last commit. */
  error?: string;
  /** Whether an async validator is still deciding about this cell. */
  validating: boolean;
  /** Resolved editor when the column is editable; always set for activatable/editing. */
  editor: CellEditor | null;
  /** Normalized select options (empty for text/number). */
  selectOptions: ReturnType<typeof normalizeEditorOptions>;
  draft: string;
  begin: () => void;
  setDraft: (value: string) => void;
  /** Wire to the editor's keydown — Enter/Tab/Escape. */
  onEditorKeyDown: (event: {
    key: string;
    preventDefault: () => void;
    shiftKey?: boolean;
  }) => void;
  /** Commit on blur (click-away). No-op when not editing. */
  commitOnBlur: () => void;
}

/**
 * Derive the per-cell editing controller. When `editing` is omitted (host
 * did not pass `onCellEdit`), always returns `mode: "display"` — zero UI
 * change for tables that never opted in.
 */
export function editableCellController<TRow>(options: {
  editing: EditableCellEditing<TRow> | undefined;
  row: TRow;
  column: ColumnDef<TRow>;
  rowId: string;
  rows: readonly TRow[];
  columns: readonly ColumnDef<TRow>[];
  rowKey: (row: TRow) => string;
}): EditableCellController {
  const { editing, row, column, rowId, rows, columns, rowKey } = options;

  const idle: EditableCellController = {
    mode: "display",
    validating: false,
    editor: null,
    selectOptions: [],
    draft: "",
    begin: () => undefined,
    setDraft: () => undefined,
    onEditorKeyDown: () => undefined,
    commitOnBlur: () => undefined,
  };

  if (!editing) return idle;

  const editor = resolveCellEditor(column);
  if (!editor || !isCellEditable(column, row)) return idle;

  const selectOptions =
    typeof editor === "object" && editor.type === "select"
      ? normalizeEditorOptions(editor.options)
      : [];

  const { state, onCellEdit, validation } = editing;
  const isEditing = state.isActive(rowId, column.key);

  const validateCell = asCellValidator<TRow>(column);
  // Nothing validates this cell, so the commit stays exactly as synchronous as
  // it has always been. A microtask on every Tab, paid by every table, to
  // support validators most tables never declare, is not a trade worth making.
  const gated =
    validation !== undefined &&
    (validateCell !== undefined || validation.hasRowValidator);

  /** Hand a resolved value to the host. */
  const sendToHost = (resolved: {
    row: TRow;
    column: EditableColumnLike<TRow>;
    value: unknown;
  }) => {
    onCellEdit(resolved.row, resolved.column.key, resolved.value);
  };

  /** Send a commit straight through — the path for an ungated column. */
  const commitNow = (commit: CellEditCommit | null): boolean => {
    if (!commit) return false;
    const resolved = resolveCommitValue({ commit, rows, columns, rowKey });
    if (!resolved) return false;
    sendToHost(resolved);
    return true;
  };

  /**
   * Run the validators, then send the value if they allow it.
   *
   * Resolves to whether the host received it, so a Tab that advances can stop
   * short: moving on while this cell is rejected would put the cursor past the
   * message the reader needs to read.
   */
  const commitValidated = async (
    commit: CellEditCommit | null
  ): Promise<boolean> => {
    if (!commit || !validation) return false;
    const resolved = resolveCommitValue({ commit, rows, columns, rowKey });
    if (!resolved) return false;
    // Hold the reader in the editor while the check runs — a cell that closes
    // and reopens on a rejection loses the caret, and an async check would
    // leave nothing on screen to mark busy.
    beginEdit(state, resolved.row, resolved.column, rowKey);
    state.setDraft(commit.draft);
    const allowed = await validation.check({
      target: { rowId: commit.rowId, columnKey: commit.columnKey },
      value: resolved.value,
      row: resolved.row,
      validateCell,
    });
    // A rejection leaves the editor exactly where it is, message attached.
    if (!allowed) return false;
    // Allowed: close the editor, then hand the value over.
    state.cancel();
    sendToHost(resolved);
    return true;
  };

  const beginNext = (target: { rowId: string; columnKey: string } | null) => {
    if (!target) return;
    const nextRow = rows.find((r) => rowKey(r) === target.rowId);
    const nextCol = columns.find((c) => c.key === target.columnKey);
    if (!nextRow || !nextCol) return;
    beginEdit(state, nextRow, nextCol, rowKey);
  };

  return {
    mode: isEditing ? "editing" : "activatable",
    // A row-level message has no cell of its own, so it shows under the cell
    // the reader just edited — where they are looking.
    error:
      validation?.errorFor(rowId, column.key) ??
      (isEditing ? validation?.rowErrorFor(rowId) : undefined),
    validating: validation?.isValidating(rowId, column.key) ?? false,
    editor,
    selectOptions,
    draft: isEditing ? state.draft : "",
    begin: () => {
      beginEdit(state, row, column, rowKey);
    },
    setDraft: state.setDraft,
    onEditorKeyDown: (event) => {
      const outcome = state.handleKeyDown(event, {
        rows,
        columns,
        rowKey: (r) => rowKey(r as TRow),
      });
      if (!outcome) return;
      if (outcome.action === "cancel") {
        validation?.clear(rowId, column.key);
        return;
      }
      const advance = () => {
        if (outcome.action === "commit-advance")
          beginNext(outcome.advanceTarget);
      };
      if (!gated) {
        if (commitNow(outcome.commit)) advance();
        return;
      }
      void commitValidated(outcome.commit).then((committed) => {
        if (committed) advance();
      });
    },
    commitOnBlur: () => {
      if (!state.isActive(rowId, column.key)) return;
      const commit = state.commit();
      if (gated) void commitValidated(commit);
      else commitNow(commit);
    },
  };
}

/**
 * A column's own validator, if it declared one.
 *
 * Read off the column rather than passed in, so a validator lives beside the
 * `editor` and `parseValue` that produce the value it judges.
 */
function asCellValidator<TRow>(column: {
  validate?: (
    value: unknown,
    row: TRow
  ) => string | undefined | Promise<string | undefined>;
}): CellValidator<TRow> | undefined {
  return column.validate;
}

/** Convenience: stop React keyboard events from bubbling to row click. */
export function stopCellEditKeyboard(
  event: Pick<ReactKeyboardEvent, "stopPropagation">
): void {
  event.stopPropagation();
}

/**
 * Attach as a `ref` (or kit `inputRef`) so the editor receives focus when the
 * cell enters edit mode — replaces the `autoFocus` attribute (axe/a11y).
 * Accepts DOM nodes and kit refs that expose `.focus()` (e.g. antd InputRef).
 */
export function focusEditorOnMount(node: { focus: () => void } | null): void {
  node?.focus();
}

/**
 * Memo digest for one desktop/card row: `null` when editing is off (host
 * never passed `onCellEdit`); empty string when this row is idle; otherwise
 * `columnKey:draft` so only the active edit row re-renders on keystrokes.
 */
export function rowEditingSignature<TRow>(
  editing: EditableCellEditing<TRow> | undefined,
  rowId: string
): string | null {
  if (!editing) return null;
  const { active, draft } = editing.state;
  // A validation message belongs to a ROW that may not hold the active editor:
  // a cross-field rule marks the cell it points at, and that row has to repaint
  // to show it. Left out, a rejected commit paints nothing.
  const marked = editing.validation?.rowHasError(rowId) ?? false;
  const busy = editing.validation?.isValidating(rowId, active?.columnKey ?? "");
  if (active?.rowId !== rowId) return marked ? "invalid" : "";
  const message = editing.validation?.errorFor(rowId, active.columnKey) ?? "";
  return `${active.columnKey}:${draft}:${message}:${busy === true ? "1" : ""}`;
}
