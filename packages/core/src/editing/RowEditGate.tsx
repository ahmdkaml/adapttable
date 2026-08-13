/**
 * A cell inside a row that is being edited as one unit, and the controls that
 * end that edit.
 *
 * Row mode reuses everything cell mode already has — the same editor set, the
 * same validation ARIA, the same custom-editor contract — so the only thing that
 * differs is where the draft lives and when it reaches the host. Both live here
 * rather than in nine adapters, because a second copy of "which editor does this
 * column want" is a second place for the answer to drift.
 */
import type { ReactElement } from "react";

import type { TableLabels } from "../types";
import {
  type CellEditor,
  type EditableColumnLike,
  isCustomEditor,
  normalizeEditorOptions,
  resolveCellEditor,
} from "./cellEditing";
import { focusEditorOnMount } from "./editableCellController";
import type { EditableCellEditorCtrl } from "./EditableCellGate";
import type { RowEditingState } from "./rowEditing";

/** Props for {@link RowEditCell}. */
export interface RowEditCellProps<TRow> {
  /** The row-editing state from the chrome. */
  rowEditing: RowEditingState<TRow>;
  /** The column this cell belongs to. */
  column: EditableColumnLike<TRow>;
  /** The cell's display content, for a column that is not editable. */
  display: ReactElement | string | number | null;
  /** Accessible name for the editor (`labels.editCell`). */
  editLabel: string;
  /**
   * Whether this is the first editable column of the row, and so the field the
   * table hands focus to when the row opens. Every field calling focus on mount
   * would leave the reader at the last column of the row they just opened.
   *
   * Not the DOM's `autoFocus`: focus moves because a reader asked to edit this
   * row, which is the case the accessibility guidance carves out.
   */
  takesFocus: boolean;
  /**
   * Render the kit's own editor from a controller — the same callback shape the
   * cell gate uses, so a kit writes one editor and both modes use it.
   */
  renderEditor: (ctrl: EditableCellEditorCtrl) => ReactElement;
}

/**
 * One cell of a row being edited: the kit's editor bound to the row's draft, or
 * the plain display when the column is not editable.
 *
 * @typeParam TRow - The row type.
 * @param props - See {@link RowEditCellProps}.
 * @returns The editor, or the display content.
 */
export function RowEditCell<TRow>({
  rowEditing,
  column,
  display,
  editLabel,
  takesFocus,
  renderEditor,
}: Readonly<RowEditCellProps<TRow>>): ReactElement {
  const editor = resolveCellEditor(column);
  if (!editor) return <>{display}</>;
  const focusRef = takesFocus ? focusEditorOnMount : () => undefined;

  const ctrl: EditableCellEditorCtrl = {
    draft: rowEditing.draftFor(column.key),
    setDraft: (value) => {
      rowEditing.setDraft(column.key, value);
    },
    // Enter saves the whole row, Escape cancels it: in row mode the unit is the
    // row, so a per-cell commit would be a different feature wearing this one's
    // keys.
    onEditorKeyDown: (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        rowEditing.save();
      } else if (event.key === "Escape") {
        event.preventDefault();
        rowEditing.cancel();
      }
    },
    // Nothing commits on blur: the reader is moving between fields of one form.
    commitOnBlur: () => undefined,
    editor,
    selectOptions: selectOptionsFor(editor),
    validating: false,
    errorId: `adapttable-row-edit-${column.key}`,
    focusRef,
  };

  if (isCustomEditor(editor)) {
    return editor.render({
      draft: ctrl.draft,
      setDraft: ctrl.setDraft,
      commit: rowEditing.save,
      cancel: rowEditing.cancel,
      onKeyDown: ctrl.onEditorKeyDown,
      onBlur: ctrl.commitOnBlur,
      focusRef,
      label: editLabel,
      validating: false,
      errorId: ctrl.errorId,
    });
  }
  return renderEditor(ctrl);
}

/** The options a chooser editor carries, normalized. */
function selectOptionsFor(editor: CellEditor) {
  if (
    typeof editor === "object" &&
    (editor.type === "select" || editor.type === "multi-select")
  ) {
    return normalizeEditorOptions(editor.options);
  }
  return [];
}

/** Props for {@link rowEditControls}. */
export interface RowEditControlsOptions<TRow> {
  /** The row-editing state from the chrome. */
  rowEditing: RowEditingState<TRow>;
  /** The row this control set belongs to. */
  row: TRow;
  /** Its stable id. */
  rowId: string;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
}

/** What a kit needs to render the row's edit / save / cancel controls. */
export interface RowEditControls {
  /** Whether this row is the one being edited. */
  editing: boolean;
  /** Open this row for editing. */
  begin: () => void;
  /** Hand the host everything that changed. */
  save: () => void;
  /** Throw the drafts away. */
  cancel: () => void;
  /** Accessible name for the control that opens the row. */
  editLabel: string;
  /** Accessible name for save. */
  saveLabel: string;
  /** Accessible name for cancel. */
  cancelLabel: string;
  /** Whether anything actually changed — a save with nothing to save is inert. */
  dirty: boolean;
}

/**
 * The row-mode controls, resolved.
 *
 * A helper rather than a component because each kit renders its own buttons —
 * what is shared is which ones exist, what they are called, and what they do.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link RowEditControlsOptions}.
 * @returns The controls to render.
 */
export function rowEditControls<TRow>({
  rowEditing,
  row,
  rowId,
  labels,
}: Readonly<RowEditControlsOptions<TRow>>): RowEditControls {
  return {
    editing: rowEditing.isEditing(rowId),
    begin: () => {
      rowEditing.begin(row, rowId);
    },
    save: rowEditing.save,
    cancel: rowEditing.cancel,
    editLabel: labels?.editRow ?? "Edit row",
    saveLabel: labels?.saveRow ?? "Save row",
    cancelLabel: labels?.cancel ?? "Cancel",
    dirty: rowEditing.isDirty,
  };
}

/** Props for {@link RowEditActions}. */
export interface RowEditActionsProps<
  TRow,
> extends RowEditControlsOptions<TRow> {
  /** Class for the control group. */
  className?: string;
  /** Class for each button. */
  buttonClassName?: string;
}

/**
 * The row's edit / save / cancel controls.
 *
 * Plain buttons with parts and labels, styled by the kit's own classes: every
 * adapter needs the same three, and the interesting part is what they do rather
 * than what they look like. A kit with a strong opinion about its buttons uses
 * {@link rowEditControls} directly instead.
 *
 * @typeParam TRow - The row type.
 * @param props - See {@link RowEditActionsProps}.
 * @returns The controls for this row.
 */
export function RowEditActions<TRow>({
  className,
  buttonClassName,
  ...options
}: Readonly<RowEditActionsProps<TRow>>): ReactElement {
  const controls = rowEditControls(options);
  if (!controls.editing) {
    return (
      <button
        type="button"
        data-adapttable-part="row-edit-begin"
        className={buttonClassName}
        aria-label={controls.editLabel}
        onClick={(event) => {
          event.stopPropagation();
          controls.begin();
        }}
      >
        {controls.editLabel}
      </button>
    );
  }
  return (
    <span
      data-adapttable-part="row-edit-actions"
      className={className}
      style={{ display: "inline-flex", gap: 4 }}
    >
      <button
        type="button"
        data-adapttable-part="row-edit-save"
        className={buttonClassName}
        aria-label={controls.saveLabel}
        onClick={(event) => {
          event.stopPropagation();
          controls.save();
        }}
      >
        {controls.saveLabel}
      </button>
      <button
        type="button"
        data-adapttable-part="row-edit-cancel"
        className={buttonClassName}
        aria-label={controls.cancelLabel}
        onClick={(event) => {
          event.stopPropagation();
          controls.cancel();
        }}
      >
        {controls.cancelLabel}
      </button>
    </span>
  );
}
