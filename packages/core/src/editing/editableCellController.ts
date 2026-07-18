import type { KeyboardEvent as ReactKeyboardEvent } from "react";

import type { ColumnDef } from "../types";
import {
  applyCellEditCommit,
  type CellEditCommit,
  type CellEditor,
  isCellEditable,
  normalizeEditorOptions,
  resolveCellEditor,
} from "./cellEditing";
import {
  beginCellEdit as beginEdit,
  type CellEditingState,
} from "./useCellEditing";

/** Opt-in editing bundle from {@link TableChrome.editing}. */
export interface EditableCellEditing<TRow> {
  onCellEdit: (row: TRow, key: string, nextValue: unknown) => void;
  state: CellEditingState;
}

/** Display / edit mode for one cell. */
export type EditableCellMode = "display" | "activatable" | "editing";

/** Controller returned by {@link editableCellController}. */
export interface EditableCellController {
  mode: EditableCellMode;
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

  const { state, onCellEdit } = editing;
  const isEditing = state.isActive(rowId, column.key);

  const applyCommit = (commit: CellEditCommit | null) => {
    if (!commit) return;
    applyCellEditCommit({
      commit,
      rows,
      columns,
      rowKey,
      onCellEdit,
    });
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
      if (outcome.action === "cancel") return;
      applyCommit(outcome.commit);
      if (outcome.action === "commit-advance") {
        beginNext(outcome.advanceTarget);
      }
    },
    commitOnBlur: () => {
      if (!state.isActive(rowId, column.key)) return;
      applyCommit(state.commit());
    },
  };
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
  if (active?.rowId !== rowId) return "";
  return `${active.columnKey}:${draft}`;
}
