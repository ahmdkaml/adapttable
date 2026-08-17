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

import type { DataTableClassNames } from "../types";
import { ClassNamesProvider, useClassNames } from "./classNamesContext";

/**
 * One saved view and its controls.
 *
 * The classes are the map's, on the two keys the saved-views *menu* already
 * uses for these two shapes: `viewsItem` for a captioned control, `viewsDelete`
 * for a compact one. One preset therefore styles the menu and the panel that
 * manages it. The row stays in normal flow — a flex container here would
 * activate the `flex-1` a preset puts on `viewsItem` for the menu's full-width
 * name and stretch every button to match.
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
  ...rest
}: SavedViewsPanelRowProps) {
  const { viewsRow, viewsItem, viewsDelete } = useClassNames();
  return (
    <div className={viewsRow} {...rest}>
      <span>{name}</span>
      {readOnly && (
        <span data-adapttable-part="saved-view-readonly">{readOnlyLabel}</span>
      )}
      {isDefault && (
        <span data-adapttable-part="saved-view-default">{defaultLabel}</span>
      )}
      <button type="button" className={viewsItem} onClick={onApply}>
        {applyLabel}
      </button>
      {(onRename ?? readOnly) && (
        <button
          type="button"
          className={viewsItem}
          onClick={onRename}
          disabled={!onRename}
        >
          {renameLabel}
        </button>
      )}
      <button
        type="button"
        className={viewsDelete}
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={moveUpLabel}
      >
        {"\u2191"}
      </button>
      <button
        type="button"
        className={viewsDelete}
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={moveDownLabel}
      >
        {"\u2193"}
      </button>
      <button
        type="button"
        className={viewsItem}
        onClick={onSetDefault}
        disabled={!onSetDefault}
      >
        {setDefaultLabel}
      </button>
      <button
        type="button"
        className={viewsItem}
        onClick={onRemove}
        disabled={!onRemove}
      >
        {removeLabel}
      </button>
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

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <div className={className} {...rest}>
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
