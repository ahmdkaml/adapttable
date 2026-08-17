/** The saved-views management panel, in MUI. */
import {
  SavedViewsPanelChrome,
  type SavedViewsPanelChromeProps,
  type SavedViewsPanelEmptyProps,
  type SavedViewsPanelInputProps,
  type SavedViewsPanelRowProps,
  type SavedViewsPanelSlots,
  type SavedViewsPanelSurfaceProps,
} from "@adapttable/core/adapter";
import { Button, Chip, Stack, TextField, Typography } from "@mui/material";

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <Stack spacing={1} className={className} {...rest}>
      {children}
    </Stack>
  ),
  Empty: ({ message }: SavedViewsPanelEmptyProps) => (
    <Typography variant="body2" color="text.secondary">
      {message}
    </Typography>
  ),
  Input: ({
    label,
    ref,
    value,
    onChange,
    onCommit,
    onCancel,
  }: SavedViewsPanelInputProps) => (
    <TextField
      size="small"
      value={value}
      inputRef={ref}
      slotProps={{ htmlInput: { "aria-label": label } }}
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
    layout,
    ...rest
  }: SavedViewsPanelRowProps) => (
    <div style={layout.row} {...rest}>
      <div style={layout.caption} data-adapttable-part="saved-view-caption">
        <Typography variant="body2">{name}</Typography>
        {readOnly && (
          <Chip
            size="small"
            variant="outlined"
            label={readOnlyLabel}
            data-adapttable-part="saved-view-readonly"
          />
        )}
        {isDefault && (
          <Chip
            size="small"
            label={defaultLabel}
            data-adapttable-part="saved-view-default"
          />
        )}
      </div>
      <div style={layout.controls} data-adapttable-part="saved-view-controls">
        <Button size="small" style={layout.control} onClick={onApply}>
          {applyLabel}
        </Button>
        {(onRename ?? readOnly) && (
          <Button
            size="small"
            style={layout.control}
            onClick={onRename}
            disabled={!onRename}
          >
            {renameLabel}
          </Button>
        )}
        <Button
          size="small"
          style={layout.control}
          onClick={onMoveUp}
          disabled={!onMoveUp}
          aria-label={moveUpLabel}
        >
          {"\u2191"}
        </Button>
        <Button
          size="small"
          style={layout.control}
          onClick={onMoveDown}
          disabled={!onMoveDown}
          aria-label={moveDownLabel}
        >
          {"\u2193"}
        </Button>
        <Button
          size="small"
          style={layout.control}
          onClick={onSetDefault}
          disabled={!onSetDefault}
        >
          {setDefaultLabel}
        </Button>
        <Button
          size="small"
          style={layout.control}
          onClick={onRemove}
          disabled={!onRemove}
        >
          {removeLabel}
        </Button>
      </div>
    </div>
  ),
};

/** Manage saved views: apply, rename, reorder, default, delete. */
export function SavedViewsPanel(
  props: Readonly<Omit<SavedViewsPanelChromeProps, "slots">>
) {
  return <SavedViewsPanelChrome {...props} slots={slots} />;
}
