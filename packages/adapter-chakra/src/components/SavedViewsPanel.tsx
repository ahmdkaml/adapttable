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
import { Badge, Button, Input, Stack, Text } from "@chakra-ui/react";

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
    layout,
    ...rest
  }: SavedViewsPanelRowProps) => (
    <div style={layout.row} {...rest}>
      <div style={layout.caption} data-adapttable-part="saved-view-caption">
        <Text fontSize="sm">{name}</Text>
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
      </div>
      <div style={layout.controls} data-adapttable-part="saved-view-controls">
        <Button
          size="xs"
          variant="outline"
          style={layout.control}
          onClick={onApply}
        >
          {applyLabel}
        </Button>
        {(onRename ?? readOnly) && (
          <Button
            size="xs"
            variant="outline"
            style={layout.control}
            onClick={onRename}
            disabled={!onRename}
          >
            {renameLabel}
          </Button>
        )}
        <Button
          size="xs"
          variant="outline"
          style={layout.control}
          onClick={onMoveUp}
          disabled={!onMoveUp}
          aria-label={moveUpLabel}
        >
          {"\u2191"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          style={layout.control}
          onClick={onMoveDown}
          disabled={!onMoveDown}
          aria-label={moveDownLabel}
        >
          {"\u2193"}
        </Button>
        <Button
          size="xs"
          variant="outline"
          style={layout.control}
          onClick={onSetDefault}
          disabled={!onSetDefault}
        >
          {setDefaultLabel}
        </Button>
        <Button
          size="xs"
          variant="outline"
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
