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
  editorValidationProps,
  NativeBooleanEditor,
  NativeMultiSelectEditor,
} from "@adapttable/core/adapter";
import {
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";

import { TextField } from "../ui";
import { NativeSelect } from "./primitives";

function stopEditKeys(event: KeyboardEvent): void {
  if (event.key === "Enter" || event.key === "Escape" || event.key === "Tab") {
    event.stopPropagation();
  }
}

/** Focus the first focusable control inside when the editor mounts. */
function FocusOnMount({
  children,
}: Readonly<{ children: ReactNode }>): ReactElement {
  const rootRef = useRef<HTMLSpanElement>(null);
  useLayoutEffect(() => {
    rootRef.current
      ?.querySelector<HTMLElement>("input, select, textarea, button")
      ?.focus();
  }, []);
  return (
    <span ref={rootRef} style={{ display: "contents" }}>
      {children}
    </span>
  );
}

/** Base UI text / number / select editor for the active cell. */
export function BaseUiCellEditor({
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
      <FocusOnMount>
        <NativeSelect
          size="1"
          width="100%"
          aria-label={label}
          value={ctrl.draft}
          options={ctrl.selectOptions}
          onValueChange={(value) => {
            ctrl.setDraft(value);
            ctrl.commitOnBlur();
          }}
        />
      </FocusOnMount>
    );
  }

  return (
    <FocusOnMount>
      <TextField.Root
        data-adapttable-part="edit-cell-editor"
        {...editorValidationProps(ctrl)}
        aria-label={label}
        size="1"
        type={editorInputType(ctrl.editor)}
        value={ctrl.draft}
        onChange={(event) => ctrl.setDraft(event.target.value)}
        onKeyDown={onKeyDown}
        onBlur={ctrl.commitOnBlur}
      />
    </FocusOnMount>
  );
}

/** Opt-in editable cell — pass-through when `editing` is omitted.
 * Callers precompute `display` in the row so memoized rows still re-invoke
 * accessors when selection/expansion changes.
 */
export function EditableDataCell<TRow>(props: {
  readonly editing: EditableCellEditing<TRow> | undefined;
  readonly row: TRow;
  readonly column: ColumnDef<TRow>;
  readonly rowId: string;
  readonly rows: readonly TRow[];
  readonly columns: readonly ColumnDef<TRow>[];
  readonly rowKey: (row: TRow) => string;
  readonly editLabel: string;
  readonly display: ReactNode;
}): ReactElement {
  return (
    <EditableCellGate
      editing={props.editing}
      row={props.row}
      column={props.column}
      rowId={props.rowId}
      rows={props.rows}
      columns={props.columns}
      rowKey={props.rowKey}
      editLabel={props.editLabel}
      display={props.display}
      renderEditor={(ctrl) => (
        <BaseUiCellEditor ctrl={ctrl} label={props.editLabel} />
      )}
    />
  );
}
