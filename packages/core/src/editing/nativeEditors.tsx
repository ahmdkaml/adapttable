/**
 * The platform's own controls for two editors, shared by every kit.
 *
 * A checkbox and a multiple `<select>` are cases where the browser already ships
 * the better answer: both are keyboard-complete, both are localized by the
 * platform, and a multiple select announces its selected count without anyone
 * writing an ARIA pattern for it. Nine hand-built versions would be nine chances
 * to get that wrong.
 *
 * A kit whose design system has a real equivalent — Mantine's `MultiSelect`,
 * MUI's multiple `Select`, antd's `Select mode="multiple"` — renders that
 * instead; these are what the others use, styled by the kit's own class.
 */
import type { KeyboardEvent, ReactElement } from "react";

import { isDraftChecked, readMultiDraft } from "./cellEditing";
import { focusEditorOnMount } from "./editableCellController";
import type { EditableCellEditorCtrl } from "./EditableCellGate";
import {
  commitBooleanDraft,
  editorValidationProps,
  multiDraftFromSelect,
} from "./EditableCellGate";

/** Props shared by the native editors. */
export interface NativeEditorProps {
  /** The controller the gate handed the kit. */
  ctrl: EditableCellEditorCtrl;
  /** Accessible name for the control. */
  label: string;
  /** The kit's own class for its editors. */
  className?: string;
  /** The kit's keydown wrapper (Enter / Escape / Tab, plus its own stopping). */
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * A checkbox editor.
 *
 * Toggling commits: a checkbox has one gesture, and a ticked box that changed
 * nothing reads as a bug rather than as an uncommitted draft.
 */
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

/**
 * A multiple-choice editor.
 *
 * Commits the array of chosen values, so a host stores back exactly what it
 * gave: no separator to parse, no single-value special case.
 */
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
