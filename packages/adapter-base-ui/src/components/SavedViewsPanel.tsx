/** The saved-views management panel, in Base UI. */
import {
  SavedViewsPanelChrome,
  type SavedViewsPanelChromeProps,
  type SavedViewsPanelEmptyProps,
  type SavedViewsPanelInputProps,
  type SavedViewsPanelRowProps,
  type SavedViewsPanelSlots,
  type SavedViewsPanelSurfaceProps,
} from "@adapttable/core/adapter";

import { Badge, Button, Flex, Text, TextField } from "../ui";

/** The adapter's own class list, in the order `DataTable` writes it. */
function classes(...parts: (string | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

const slots: SavedViewsPanelSlots = {
  // The adapter's tokens live on `adapttable-base-ui`, and a panel mounted
  // beside the table rather than inside it is outside that scope — without the
  // class every `var(--adapttable-*)` in here resolves to nothing and the kit's
  // own controls paint as bare text.
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <Flex
      direction="column"
      gap="2"
      className={classes("adapttable-base-ui", className)}
      {...rest}
    >
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
    layout,
    ...rest
  }: SavedViewsPanelRowProps) => (
    <div style={layout.row} {...rest}>
      <div style={layout.caption} data-adapttable-part="saved-view-caption">
        <Text size="2">{name}</Text>
        {readOnly && (
          <Badge
            size="1"
            color="gray"
            data-adapttable-part="saved-view-readonly"
          >
            {readOnlyLabel}
          </Badge>
        )}
        {isDefault && (
          <Badge size="1" data-adapttable-part="saved-view-default">
            {defaultLabel}
          </Badge>
        )}
      </div>
      <div style={layout.controls} data-adapttable-part="saved-view-controls">
        <Button
          size="1"
          variant="soft"
          style={layout.control}
          onClick={onApply}
        >
          {applyLabel}
        </Button>
        {(onRename ?? readOnly) && (
          <Button
            size="1"
            variant="soft"
            style={layout.control}
            onClick={onRename}
            disabled={!onRename}
          >
            {renameLabel}
          </Button>
        )}
        <Button
          size="1"
          variant="soft"
          style={layout.control}
          onClick={onMoveUp}
          disabled={!onMoveUp}
          aria-label={moveUpLabel}
        >
          {"\u2191"}
        </Button>
        <Button
          size="1"
          variant="soft"
          style={layout.control}
          onClick={onMoveDown}
          disabled={!onMoveDown}
          aria-label={moveDownLabel}
        >
          {"\u2193"}
        </Button>
        <Button
          size="1"
          variant="soft"
          style={layout.control}
          onClick={onSetDefault}
          disabled={!onSetDefault}
        >
          {setDefaultLabel}
        </Button>
        <Button
          size="1"
          variant="soft"
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
