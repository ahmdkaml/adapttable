import {
  type ColumnDef,
  type EditableCellEditing,
  type EditableCellEditorCtrl,
  EditableCellGate,
  editorInputType,
  isBooleanEditor,
  isMultiSelectEditor,
  isSelectEditor,
} from "@adapttable/core";
import {
  editorBusyProps,
  focusEditorOnMount,
  NativeBooleanEditor,
  NativeMultiSelectEditor,
} from "@adapttable/core/adapter";
import { MenuItem, TextField } from "@mui/material";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";

function stopEditKeys(event: KeyboardEvent): void {
  if (event.key === "Enter" || event.key === "Escape" || event.key === "Tab") {
    event.stopPropagation();
  }
}

/** MUI text / number / select editor for the active cell. */
export function MuiCellEditor({
  ctrl,
  label,
}: Readonly<{
  ctrl: EditableCellEditorCtrl;
  label: string;
}>): ReactElement {
  const onKeyDown = (event: KeyboardEvent) => {
    ctrl.onEditorKeyDown(event);
    stopEditKeys(event);
  };

  if (isBooleanEditor(ctrl.editor)) {
    return (
      <NativeBooleanEditor ctrl={ctrl} label={label} onKeyDown={onKeyDown} />
    );
  }

  if (isMultiSelectEditor(ctrl.editor)) {
    return (
      <NativeMultiSelectEditor
        ctrl={ctrl}
        label={label}
        onKeyDown={onKeyDown}
      />
    );
  }

  if (isSelectEditor(ctrl.editor)) {
    return (
      <TextField
        inputRef={focusEditorOnMount}
        select
        size="small"
        fullWidth
        value={ctrl.draft}
        onChange={(event) => ctrl.setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={ctrl.commitOnBlur}
        error={ctrl.error !== undefined}
        helperText={ctrl.error}
        slotProps={{
          htmlInput: {
            "aria-label": label,
            "data-adapttable-part": "edit-cell-editor",
            ...editorBusyProps(ctrl),
          },
        }}
      >
        {ctrl.selectOptions.map((option) => (
          <MenuItem key={option.value} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </TextField>
    );
  }

  return (
    <TextField
      inputRef={focusEditorOnMount}
      size="small"
      fullWidth
      type={editorInputType(ctrl.editor)}
      value={ctrl.draft}
      onChange={(event) => ctrl.setDraft(event.target.value)}
      onKeyDown={onKeyDown}
      onBlur={ctrl.commitOnBlur}
      error={ctrl.error !== undefined}
      helperText={ctrl.error}
      slotProps={{
        htmlInput: {
          "aria-label": label,
          "data-adapttable-part": "edit-cell-editor",
          ...editorBusyProps(ctrl),
        },
      }}
    />
  );
}

/** Opt-in editable cell — pass-through when `editing` is omitted. */
export function EditableDataCell<TRow>(props: {
  readonly editing: EditableCellEditing<TRow> | undefined;
  readonly row: TRow;
  readonly column: ColumnDef<TRow>;
  readonly rowId: string;
  readonly rowIndex: number;
  readonly rows: readonly TRow[];
  readonly columns: readonly ColumnDef<TRow>[];
  readonly rowKey: (row: TRow) => string;
  readonly editLabel: string;
  /** `labels.undoEdit` — the control a failed save offers. */
  readonly undoLabel?: string;
}): ReactElement {
  const display: ReactNode = props.column.Cell ? (
    <props.column.Cell row={props.row} rowIndex={props.rowIndex} />
  ) : (
    props.column.accessor?.(props.row)
  );

  return (
    <EditableCellGate
      kitRendersError
      editing={props.editing}
      row={props.row}
      column={props.column}
      rowId={props.rowId}
      rows={props.rows}
      columns={props.columns}
      rowKey={props.rowKey}
      editLabel={props.editLabel}
      undoLabel={props.undoLabel}
      display={display}
      renderEditor={(ctrl) => (
        <MuiCellEditor ctrl={ctrl} label={props.editLabel} />
      )}
    />
  );
}
