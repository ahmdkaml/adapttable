/** The saved-views management panel, in Chakra UI. */
import {
  SavedViewsPanelChrome,
  type SavedViewsPanelChromeProps,
  type SavedViewsPanelEmptyProps,
  type SavedViewsPanelInputProps,
  type SavedViewsPanelRowProps,
  type SavedViewsPanelSlots,
  type SavedViewsPanelSurfaceProps,
} from "@adapttable/core/adapter";
import { Badge, Button, HStack, Input, Stack, Text } from "@chakra-ui/react";

import { subtleText } from "../styles";

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <Stack gap={2} className={className} {...rest}>
      {children}
    </Stack>
  ),
  Empty: ({ message }: SavedViewsPanelEmptyProps) => (
    <Text fontSize="sm" {...subtleText}>
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
    <Input
      size="xs"
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
    <HStack gap={1} {...rest}>
      <Text fontSize="sm" flex="1">
        {name}
      </Text>
      {readOnly && (
        <Badge
          size="sm"
          variant="outline"
          data-adapttable-part="saved-view-readonly"
        >
          {readOnlyLabel}
        </Badge>
      )}
      {isDefault && (
        <Badge size="sm" data-adapttable-part="saved-view-default">
          {defaultLabel}
        </Badge>
      )}
      <Button size="xs" variant="outline" onClick={onApply}>
        {applyLabel}
      </Button>
      {(onRename ?? readOnly) && (
        <Button
          size="xs"
          variant="outline"
          onClick={onRename}
          disabled={!onRename}
        >
          {renameLabel}
        </Button>
      )}
      <Button
        size="xs"
        variant="outline"
        onClick={onMoveUp}
        disabled={!onMoveUp}
        aria-label={moveUpLabel}
      >
        {"\u2191"}
      </Button>
      <Button
        size="xs"
        variant="outline"
        onClick={onMoveDown}
        disabled={!onMoveDown}
        aria-label={moveDownLabel}
      >
        {"\u2193"}
      </Button>
      <Button
        size="xs"
        variant="outline"
        onClick={onSetDefault}
        disabled={!onSetDefault}
      >
        {setDefaultLabel}
      </Button>
      <Button
        size="xs"
        variant="outline"
        onClick={onRemove}
        disabled={!onRemove}
      >
        {removeLabel}
      </Button>
    </HStack>
  ),
};

/** Manage saved views: apply, rename, reorder, default, delete. */
export function SavedViewsPanel(
  props: Readonly<Omit<SavedViewsPanelChromeProps, "slots">>
) {
  return <SavedViewsPanelChrome {...props} slots={slots} />;
}
