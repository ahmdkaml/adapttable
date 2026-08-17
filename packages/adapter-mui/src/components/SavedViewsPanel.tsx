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
    ...rest
  }: SavedViewsPanelRowProps) => (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ alignItems: "center" }}
      {...rest}
    >
      <Typography variant="body2" sx={{ flex: 1 }}>
        {name}
      </Typography>
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
      <Button size="small" onClick={onApply}>
        {applyLabel}
      </Button>
      {(onRename ?? readOnly) && (
        <Button size="small" onClick={onRename} disabled={!onRename}>
          {renameLabel}
        </Button>
      )}
      <Button
        size="small"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={moveUpLabel}
      >
        {"\u2191"}
      </Button>
      <Button
        size="small"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={moveDownLabel}
      >
        {"\u2193"}
      </Button>
      <Button size="small" onClick={onSetDefault} disabled={!onSetDefault}>
        {setDefaultLabel}
      </Button>
      <Button size="small" onClick={onRemove} disabled={!onRemove}>
        {removeLabel}
      </Button>
    </Stack>
  ),
};

/** Manage saved views: apply, rename, reorder, default, delete. */
export function SavedViewsPanel(
  props: Readonly<Omit<SavedViewsPanelChromeProps, "slots">>
) {
  return <SavedViewsPanelChrome {...props} slots={slots} />;
}
