/** The saved-views management panel, in Ant Design. */
import {
  SavedViewsPanelChrome,
  type SavedViewsPanelChromeProps,
  type SavedViewsPanelEmptyProps,
  type SavedViewsPanelInputProps,
  type SavedViewsPanelRowProps,
  type SavedViewsPanelSlots,
  type SavedViewsPanelSurfaceProps,
} from "@adapttable/core/adapter";
import { Button, Flex, Input, Tag, Typography } from "antd";

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, className, ...rest }: SavedViewsPanelSurfaceProps) => (
    <Flex vertical gap={8} className={className} {...rest}>
      {children}
    </Flex>
  ),
  Empty: ({ message }: SavedViewsPanelEmptyProps) => (
    <Typography.Text type="secondary">{message}</Typography.Text>
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
      size="small"
      value={value}
      ref={(instance) => {
        ref(instance?.input ?? null);
      }}
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
    <Flex gap={4} align="center" {...rest}>
      <Typography.Text style={{ flex: 1 }}>{name}</Typography.Text>
      {isDefault && <Tag>{defaultLabel}</Tag>}
      <Button size="small" onClick={onApply}>
        {applyLabel}
      </Button>
      {onRename && (
        <Button size="small" onClick={onRename}>
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
      <Button size="small" onClick={onSetDefault}>
        {setDefaultLabel}
      </Button>
      <Button size="small" onClick={onRemove}>
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
