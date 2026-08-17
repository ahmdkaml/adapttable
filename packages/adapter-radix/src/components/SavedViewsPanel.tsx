/** The saved-views management panel, in Radix Themes. */
import {
  SavedViewsPanelChrome,
  type SavedViewsPanelChromeProps,
  type SavedViewsPanelEmptyProps,
  type SavedViewsPanelInputProps,
  type SavedViewsPanelRowProps,
  type SavedViewsPanelSlots,
  type SavedViewsPanelSurfaceProps,
} from "@adapttable/core/adapter";
import { Badge, Button, Flex, Text, TextField } from "@radix-ui/themes";

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <Flex direction="column" gap="2" className={className} {...rest}>
      {children}
    </Flex>
  ),
  Empty: ({ message }: SavedViewsPanelEmptyProps) => (
    <Text size="2" color="gray">
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
    <TextField.Root
      size="1"
      value={value}
      ref={ref}
      aria-label={label}
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
    <Flex gap="1" align="center" {...rest}>
      <Text size="2" style={{ flex: 1 }}>
        {name}
      </Text>
      {readOnly && (
        <Badge size="1" color="gray" data-adapttable-part="saved-view-readonly">
          {readOnlyLabel}
        </Badge>
      )}
      {isDefault && (
        <Badge size="1" data-adapttable-part="saved-view-default">
          {defaultLabel}
        </Badge>
      )}
      <Button size="1" variant="soft" onClick={onApply}>
        {applyLabel}
      </Button>
      {(onRename ?? readOnly) && (
        <Button size="1" variant="soft" onClick={onRename} disabled={!onRename}>
          {renameLabel}
        </Button>
      )}
      <Button
        size="1"
        variant="soft"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={moveUpLabel}
      >
        {"\u2191"}
      </Button>
      <Button
        size="1"
        variant="soft"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={moveDownLabel}
      >
        {"\u2193"}
      </Button>
      <Button
        size="1"
        variant="soft"
        onClick={onSetDefault}
        disabled={!onSetDefault}
      >
        {setDefaultLabel}
      </Button>
      <Button size="1" variant="soft" onClick={onRemove} disabled={!onRemove}>
        {removeLabel}
      </Button>
    </Flex>
  ),
};

/** Manage saved views: apply, rename, reorder, default, delete. */
export function SavedViewsPanel(
  props: Readonly<Omit<SavedViewsPanelChromeProps, "slots">>
) {
  return <SavedViewsPanelChrome {...props} slots={slots} />;
}
