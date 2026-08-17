/** The saved-views management panel, in Mantine. */
import {
  SavedViewsPanelChrome,
  type SavedViewsPanelChromeProps,
  type SavedViewsPanelEmptyProps,
  type SavedViewsPanelInputProps,
  type SavedViewsPanelRowProps,
  type SavedViewsPanelSlots,
  type SavedViewsPanelSurfaceProps,
} from "@adapttable/core/adapter";
import { Badge, Button, Group, Stack, Text, TextInput } from "@mantine/core";

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <Stack gap="xs" className={className} {...rest}>
      {children}
    </Stack>
  ),
  Empty: ({ message }: SavedViewsPanelEmptyProps) => (
    <Text fz="sm" c="dimmed">
      {message}
    </Text>
  ),
  Input: ({
    label,
    ref,
    value,
    onChange,
    onCommit,
    onCancel,
  }: SavedViewsPanelInputProps) => (
    <TextInput
      size="xs"
      aria-label={label}
      value={value}
      ref={ref}
      onChange={(event) => {
        onChange(event.currentTarget.value);
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
    defaultLabel,
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
    <Group gap={4} wrap="nowrap" {...rest}>
      <Text fz="sm" style={{ flex: 1 }}>
        {name}
      </Text>
      {isDefault && <Badge size="xs">{defaultLabel}</Badge>}
      <Button size="compact-xs" variant="default" onClick={onApply}>
        {applyLabel}
      </Button>
      {onRename && (
        <Button size="compact-xs" variant="default" onClick={onRename}>
          {renameLabel}
        </Button>
      )}
      <Button
        size="compact-xs"
        variant="default"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={moveUpLabel}
      >
        {"\u2191"}
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={moveDownLabel}
      >
        {"\u2193"}
      </Button>
      <Button size="compact-xs" variant="default" onClick={onSetDefault}>
        {setDefaultLabel}
      </Button>
      <Button size="compact-xs" variant="default" onClick={onRemove}>
        {removeLabel}
      </Button>
    </Group>
  ),
};

/** Manage saved views: apply, rename, reorder, default, delete. */
export function SavedViewsPanel(
  props: Readonly<Omit<SavedViewsPanelChromeProps, "slots">>
) {
  return <SavedViewsPanelChrome {...props} slots={slots} />;
}
