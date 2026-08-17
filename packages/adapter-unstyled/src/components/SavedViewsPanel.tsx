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

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <div className={className} {...rest}>
      {children}
    </div>
  ),
  Empty: ({ message }: SavedViewsPanelEmptyProps) => <p>{message}</p>,
  Input: ({
    label,
    ref,
    value,
    onChange,
    onCommit,
    onCancel,
  }: SavedViewsPanelInputProps) => (
    <input
      aria-label={label}
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
  ),
  Row: ({
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
  }: SavedViewsPanelRowProps) => (
    <div {...rest}>
      <span>{name}</span>
      {readOnly && (
        <span data-adapttable-part="saved-view-readonly">{readOnlyLabel}</span>
      )}
      {isDefault && (
        <span data-adapttable-part="saved-view-default">{defaultLabel}</span>
      )}
      <button type="button" onClick={onApply}>
        {applyLabel}
      </button>
      {(onRename ?? readOnly) && (
        <button type="button" onClick={onRename} disabled={!onRename}>
          {renameLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={moveUpLabel}
      >
        {"\u2191"}
      </button>
      <button
        type="button"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={moveDownLabel}
      >
        {"\u2193"}
      </button>
      <button type="button" onClick={onSetDefault} disabled={!onSetDefault}>
        {setDefaultLabel}
      </button>
      <button type="button" onClick={onRemove} disabled={!onRemove}>
        {removeLabel}
      </button>
    </div>
  ),
};

/** Manage saved views: apply, rename, reorder, default, delete. */
export function SavedViewsPanel(
  props: Readonly<Omit<SavedViewsPanelChromeProps, "slots">>
) {
  return <SavedViewsPanelChrome {...props} slots={slots} />;
}
