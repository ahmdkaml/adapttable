/** The saved-views management panel, in native HTML. */
import {
  SavedViewsPanelChrome,
  type SavedViewsPanelChromeProps,
  type SavedViewsPanelEmptyProps,
  type SavedViewsPanelInputProps,
  type SavedViewsPanelRowProps,
  type SavedViewsPanelSlots,
  type SavedViewsPanelSurfaceProps,
} from "@adapttable/core/adapter";
import type { CSSProperties } from "react";

import type { DataTableClassNames } from "../types";
import { ClassNamesProvider, useClassNames } from "./classNamesContext";

/**
 * One saved view and its controls.
 *
 * The classes are the map's, on the two keys the saved-views *menu* already
 * uses for these two shapes: `viewsItem` for a captioned control, `viewsDelete`
 * for a compact one. One preset therefore styles the menu and the panel that
 * manages it. A preset writes those keys for the menu, where `viewsItem` is the
 * full-width name of one view — so the chrome's `control` layout follows the
 * class on each button: here they are six siblings that keep their own
 * captions, not one that fills the row.
 *
 * The slot reads the map from context rather than closing over it, which is
 * what keeps the rename box from being remounted — and losing the caret —
 * on every keystroke.
 */
function Row({
  name,
  isDefault,
  readOnly,
  defaultLabel,
  readOnlyLabel,
  onApply,
  onRename,
  onMoveUp,
  onMoveDown,
  onSetDefault,
  onRemove,
  applyLabel,
  renameLabel,
  moveUpLabel,
  moveDownLabel,
  setDefaultLabel,
  removeLabel,
  layout,
  ...rest
}: SavedViewsPanelRowProps) {
  const { viewsRow, viewsItem, viewsDelete } = useClassNames();
  return (
    <div className={viewsRow} style={layout.row} {...rest}>
      <div style={layout.caption} data-adapttable-part="saved-view-caption">
        <span>{name}</span>
        {readOnly && (
          <span data-adapttable-part="saved-view-readonly">
            {readOnlyLabel}
          </span>
        )}
        {isDefault && (
          <span data-adapttable-part="saved-view-default">{defaultLabel}</span>
        )}
      </div>
      <div style={layout.controls} data-adapttable-part="saved-view-controls">
        <button
          type="button"
          className={viewsItem}
          style={layout.control}
          onClick={onApply}
        >
          {applyLabel}
        </button>
        {(onRename ?? readOnly) && (
          <button
            type="button"
            className={viewsItem}
            style={layout.control}
            onClick={onRename}
            disabled={!onRename}
          >
            {renameLabel}
          </button>
        )}
        <button
          type="button"
          className={viewsDelete}
          style={layout.control}
          onClick={onMoveUp}
          disabled={!onMoveUp}
          aria-label={moveUpLabel}
        >
          {"\u2191"}
        </button>
        <button
          type="button"
          className={viewsDelete}
          style={layout.control}
          onClick={onMoveDown}
          disabled={!onMoveDown}
          aria-label={moveDownLabel}
        >
          {"\u2193"}
        </button>
        <button
          type="button"
          className={viewsItem}
          style={layout.control}
          onClick={onSetDefault}
          disabled={!onSetDefault}
        >
          {setDefaultLabel}
        </button>
        <button
          type="button"
          className={viewsItem}
          style={layout.control}
          onClick={onRemove}
          disabled={!onRemove}
        >
          {removeLabel}
        </button>
      </div>
    </div>
  );
}

/** The inline rename box, on the `viewsInput` key the menu's own box uses. */
function Input({
  label,
  ref,
  value,
  onChange,
  onCommit,
  onCancel,
}: SavedViewsPanelInputProps) {
  const { viewsInput } = useClassNames();
  return (
    <input
      aria-label={label}
      className={viewsInput}
      value={value}
      ref={ref}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit();
        if (event.key === "Escape") onCancel();
      }}
    />
  );
}

/**
 * The panel body. Every other kit stacks its rows with the kit's own Stack;
 * native has none, and a row that wraps its controls onto a second line runs
 * into the next view's name without one.
 */
const PANEL: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: 8,
  minWidth: 0,
};

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <div className={className} style={PANEL} {...rest}>
      {children}
    </div>
  ),
  Empty: ({ message }: SavedViewsPanelEmptyProps) => <p>{message}</p>,
  Input,
  Row,
};

/**
 * Manage saved views: apply, rename, reorder, default, delete.
 *
 * Native markup carries no look of its own, so the panel takes the same
 * `classNames` map the table does and honors the `views*` keys — a panel
 * mounted beside a styled table would otherwise be raw HTML beside it.
 */
export function SavedViewsPanel(
  props: Readonly<
    Omit<SavedViewsPanelChromeProps, "slots"> & {
      classNames?: DataTableClassNames;
    }
  >
) {
  const { classNames, ...rest } = props;
  return (
    <ClassNamesProvider classNames={classNames}>
      <SavedViewsPanelChrome
        {...rest}
        className={classNames?.viewsPanel}
        slots={slots}
      />
    </ClassNamesProvider>
  );
}
