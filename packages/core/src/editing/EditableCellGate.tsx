import {
  type ReactElement,
  type ReactNode,
  useLayoutEffect,
  useRef,
} from "react";

import type { ColumnDef } from "../types";
import { booleanDraft, formatMultiDraft } from "./cellEditing";
import {
  editableCellController,
  type EditableCellEditing,
  stopCellEditKeyboard,
} from "./editableCellController";

/** Props for a kit-native editor while a cell is active. */
export interface EditableCellEditorCtrl {
  draft: string;
  setDraft: (value: string) => void;
  onEditorKeyDown: (event: {
    key: string;
    preventDefault: () => void;
    shiftKey?: boolean;
  }) => void;
  commitOnBlur: () => void;
  editor: NonNullable<ReturnType<typeof editableCellController>["editor"]>;
  selectOptions: ReturnType<typeof editableCellController>["selectOptions"];
  /**
   * A validator's message for this cell, when the last commit was rejected.
   * Wire it to the kit's own error surface (Mantine's `error`, MUI's
   * `helperText`, …) — and it is on the DOM either way, see `errorId`.
   */
  error?: string;
  /** Whether an async validator is still deciding. */
  validating: boolean;
  /**
   * `id` of the element holding the message. Put it on the editor's
   * `aria-describedby` so the message is announced with the field, and set
   * `aria-invalid` when `error` is set.
   */
  errorId: string;
}

/**
 * Opt-in cell wrapper: plain display when editing is off; double-click /
 * Enter / F2 to activate; kit supplies the editor via `renderEditor`.
 *
 * When `editing` is omitted this is a pure pass-through of `display` —
 * zero DOM / behavior change for tables that never opted into cell edit.
 */
export interface EditableCellGateProps<TRow> {
  readonly editing: EditableCellEditing<TRow> | undefined;
  readonly row: TRow;
  readonly column: ColumnDef<TRow>;
  readonly rowId: string;
  readonly rows: readonly TRow[];
  readonly columns: readonly ColumnDef<TRow>[];
  readonly rowKey: (row: TRow) => string;
  /** Accessible name for the activate control. */
  readonly editLabel: string;
  /** Optional class for the activate button (adapters' styling hook). */
  readonly activateClassName?: string;
  /** Optional class for the validation message (adapters' styling hook). */
  readonly errorClassName?: string;
  /**
   * Set by a kit whose own input renders the message — Mantine's `error`, MUI's
   * `helperText`. Those components own the input's `aria-describedby`, so a
   * second copy of the text would be both duplicated in the DOM and announced
   * twice. The gate then renders no message of its own and leaves the ARIA to
   * the kit.
   */
  readonly kitRendersError?: boolean;
  readonly display: ReactNode;
  /**
   * Kit-native editor. Only called while this cell is the active edit.
   * Wire `value`/`onChange`/`onKeyDown`/`onBlur` from the controller.
   */
  readonly renderEditor: (ctrl: EditableCellEditorCtrl) => ReactElement;
}

/**
 * The ARIA a kit's editor needs when validation is in play.
 *
 * Spread onto the input or select: invalid marks the field, `describedby`
 * points at the message so it is read WITH the field rather than announced
 * once and lost, and busy says an async check is still deciding.
 *
 * @param ctrl - The editor controller the gate handed the kit.
 * @returns Attributes to spread; empty while the value is fine.
 */
export function editorValidationProps(ctrl: EditableCellEditorCtrl): {
  "aria-invalid"?: true;
  "aria-describedby"?: string;
  "aria-busy"?: true;
} {
  return {
    "aria-invalid": ctrl.error === undefined ? undefined : true,
    "aria-describedby": ctrl.error === undefined ? undefined : ctrl.errorId,
    "aria-busy": ctrl.validating ? true : undefined,
  };
}

/**
 * Just the busy flag, for a kit whose own input owns `aria-invalid` and
 * `aria-describedby` (Mantine, MUI). Nothing else about an async check reaches
 * those components, so this is the one attribute still ours to set.
 *
 * @param ctrl - The editor controller the gate handed the kit.
 * @returns The attribute to spread; empty unless a check is running.
 */
export function editorBusyProps(ctrl: EditableCellEditorCtrl): {
  "aria-busy"?: true;
} {
  return { "aria-busy": ctrl.validating ? true : undefined };
}

/**
 * Toggle a checkbox editor and commit in the same gesture.
 *
 * A checkbox has one gesture, so waiting for Enter or a blur would leave the
 * reader looking at a ticked box that has changed nothing. Safe to call
 * synchronously: the editing state writes its draft ref in the same tick, so the
 * commit that follows sees the new value.
 *
 * @param ctrl - The editor controller the gate handed the kit.
 * @param checked - The box's new state.
 */
export function commitBooleanDraft(
  ctrl: EditableCellEditorCtrl,
  checked: boolean
): void {
  ctrl.setDraft(booleanDraft(checked));
  ctrl.commitOnBlur();
}

/**
 * The draft for a native `<select multiple>`'s current selection.
 *
 * @param select - The select element.
 * @returns The draft string the editing state holds.
 */
export function multiDraftFromSelect(select: HTMLSelectElement): string {
  return formatMultiDraft(
    [...select.selectedOptions].map((option) => option.value)
  );
}

export function EditableCellGate<TRow>(
  props: EditableCellGateProps<TRow>
): ReactElement {
  const activateRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef(false);

  const ctrl = editableCellController({
    editing: props.editing,
    row: props.row,
    column: props.column,
    rowId: props.rowId,
    rows: props.rows,
    columns: props.columns,
    rowKey: props.rowKey,
  });

  useLayoutEffect(() => {
    if (!restoreFocusRef.current || ctrl.mode !== "activatable") return;
    restoreFocusRef.current = false;
    activateRef.current?.focus();
  });

  if (ctrl.mode === "display") {
    return <>{props.display}</>;
  }

  const errorId = `adapttable-edit-error-${props.rowId}-${props.column.key}`;

  if (ctrl.mode === "editing" && ctrl.editor) {
    return (
      <>
        {props.renderEditor({
          draft: ctrl.draft,
          setDraft: ctrl.setDraft,
          onEditorKeyDown: (event) => {
            // Escape cancels, Enter commits — BOTH must hand keyboard focus
            // back to the activate button, or it falls to <body>. (Tab moves
            // to the next editable cell, which manages its own focus.)
            if (event.key === "Escape" || event.key === "Enter") {
              restoreFocusRef.current = true;
            }
            ctrl.onEditorKeyDown(event);
          },
          commitOnBlur: ctrl.commitOnBlur,
          editor: ctrl.editor,
          selectOptions: ctrl.selectOptions,
          error: ctrl.error,
          validating: ctrl.validating,
          errorId,
        })}
        {/* The message is in the DOM whatever the kit does with `error`, and
            it is a live region so it is heard the moment it appears — a
            rejected commit that only paints red says nothing to a reader who
            cannot see it. */}
        {ctrl.error !== undefined && props.kitRendersError !== true && (
          <span
            id={errorId}
            role="alert"
            data-adapttable-part="edit-cell-error"
            className={props.errorClassName}
          >
            {ctrl.error}
          </span>
        )}
      </>
    );
  }

  return (
    <button
      ref={activateRef}
      type="button"
      // The cell VALUE is the accessible name (the button's content); the
      // edit affordance rides along as the title — an aria-label here
      // would hide the value from screen readers entirely.
      title={props.editLabel}
      className={props.activateClassName}
      data-adapttable-part="edit-cell-activate"
      onDoubleClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        ctrl.begin();
      }}
      onClick={(event) => {
        // Keep row-click from firing when the user is aiming to edit.
        event.stopPropagation();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === "F2") {
          event.preventDefault();
          stopCellEditKeyboard(event);
          ctrl.begin();
        }
      }}
      style={{
        all: "unset",
        boxSizing: "border-box",
        display: "block",
        width: "100%",
        cursor: "text",
        textAlign: "inherit",
      }}
    >
      {props.display}
    </button>
  );
}
