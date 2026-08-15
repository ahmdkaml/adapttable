import {
  type EditableCellEditorCtrl,
  isDraftChecked,
  readMultiDraft,
} from "@adapttable/core";
import {
  commitBooleanDraft,
  editorValidationProps,
  focusEditorOnMount,
  multiDraftFromSelect,
} from "@adapttable/core/adapter";
import type { KeyboardEvent, ReactElement } from "react";

export interface NativeEditorProps {
  ctrl: EditableCellEditorCtrl;
  label: string;
  className?: string;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

export function NativeBooleanEditor({
  ctrl,
  label,
  className,
  onKeyDown,
}: Readonly<NativeEditorProps>): ReactElement {
  return (
    <input
      ref={focusEditorOnMount}
      data-adapttable-part="edit-cell-editor"
      {...editorValidationProps(ctrl)}
      className={className}
      aria-label={label}
      type="checkbox"
      checked={isDraftChecked(ctrl.draft)}
      onChange={(event) => {
        commitBooleanDraft(ctrl, event.target.checked);
      }}
      onKeyDown={onKeyDown}
    />
  );
}

export function NativeMultiSelectEditor({
  ctrl,
  label,
  className,
  onKeyDown,
}: Readonly<NativeEditorProps>): ReactElement {
  return (
    <select
      ref={focusEditorOnMount}
      data-adapttable-part="edit-cell-editor"
      {...editorValidationProps(ctrl)}
      className={className}
      aria-label={label}
      multiple
      value={readMultiDraft(ctrl.draft)}
      onChange={(event) => {
        ctrl.setDraft(multiDraftFromSelect(event.target));
      }}
      onKeyDown={onKeyDown}
      onBlur={ctrl.commitOnBlur}
    >
      {ctrl.selectOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}
