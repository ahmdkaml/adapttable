/**
 * Mantine kit controls — TextInput / NativeSelect / Button / ActionIcon / Checkbox.
 * Same `data-adapttable-part` names the chrome and the e2e suite already use.
 */
import {
  BatchEditBarChrome,
  type BatchEditBarProps,
  type BatchEditButtonProps,
  type ColumnGroupToggleButtonProps,
  ColumnGroupToggleChrome,
  type ColumnGroupToggleProps,
  type EditableCellActivateProps,
  type EditableCellButtonProps,
  type EditableCellSlots,
  FilterHeaderChrome,
  FilterHeaderControlChrome,
  type FilterHeaderControlProps,
  type FilterHeaderMultiProps,
  type FilterHeaderRangeProps,
  type FilterHeaderRowProps,
  type FilterHeaderSearchProps,
  type FilterHeaderSelectProps,
  type FilterHeaderSlots,
  FindBarChrome,
  type FindBarProps,
  type FindButtonProps,
  type FindSearchProps,
  GripIcon,
  GroupMoreButtonChrome,
  type GroupMoreButtonProps,
  type GroupMoreButtonSlotProps,
  RowEditActionsChrome,
  type RowEditActionsProps,
  type RowEditButtonProps,
  RowReorderButtonsChrome,
  type RowReorderButtonsProps,
  RowReorderHandleChrome,
  type RowReorderHandleProps,
  type RowReorderHandleSlotProps,
  type RowReorderMoveButtonProps,
  TreeCellChrome,
  type TreeCellProps,
  type TreeToggleButtonProps,
  TreeToggleChrome,
  type TreeToggleProps,
  type TreeToggleSlots,
} from "@adapttable/core/adapter";
import {
  ActionIcon,
  Button,
  Checkbox,
  NativeSelect,
  TextInput,
} from "@mantine/core";

export type {
  BatchEditBarProps,
  ColumnGroupToggleProps,
  FilterHeaderControlProps,
  FilterHeaderRowProps,
  FindBarProps,
  GroupMoreButtonProps,
  RowEditActionsProps,
  RowReorderButtonsProps,
  RowReorderHandleProps,
  TreeCellProps,
  TreeToggleProps,
};

const FIND_GLYPH: Record<string, string> = {
  previous: "↑",
  next: "↓",
  close: "✕",
};

const ACTIVATE_STYLE = {
  all: "unset",
  boxSizing: "border-box",
  display: "block",
  width: "100%",
  cursor: "text",
  textAlign: "inherit",
} as const;

function HeaderSearch({
  label,
  placeholder,
  value,
  className,
  onChange,
}: FilterHeaderSearchProps) {
  return (
    <TextInput
      size="xs"
      type="search"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      className={className}
      data-adapttable-part="filter-header-input"
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

function HeaderSelect({
  label,
  value,
  options,
  className,
  onChange,
}: FilterHeaderSelectProps) {
  return (
    <NativeSelect
      size="xs"
      aria-label={label}
      value={value}
      className={className}
      data-adapttable-part="filter-header-input"
      onChange={(event) => onChange(event.currentTarget.value)}
      data={options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
    />
  );
}

function HeaderRange({ label, type, value, onChange }: FilterHeaderRangeProps) {
  return (
    <TextInput
      size="xs"
      type={type}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  );
}

function HeaderMulti({
  label,
  summary,
  options,
  selected,
  className,
  menuClassName,
  onToggle,
}: FilterHeaderMultiProps) {
  return (
    <details
      data-adapttable-part="filter-header-menu"
      className={menuClassName}
      style={{ position: "relative", width: "100%" }}
    >
      <summary
        aria-label={label}
        data-adapttable-part="filter-header-input"
        className={className}
        style={{
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
          boxSizing: "border-box",
          width: "100%",
          minHeight: 28,
          paddingInline: 8,
          border:
            "1px solid var(--mantine-color-default-border, color-mix(in srgb, currentColor 24%, transparent))",
          borderRadius: "var(--mantine-radius-default, 4px)",
          background: "var(--mantine-color-default, Canvas)",
          listStyle: "none",
        }}
      >
        <span
          style={{
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {summary}
        </span>
        <span aria-hidden>▾</span>
      </summary>
      <div
        role="listbox"
        aria-multiselectable
        style={{
          position: "absolute",
          zIndex: 8,
          top: "100%",
          insetInlineStart: 0,
          minWidth: "100%",
          maxHeight: 220,
          overflow: "auto",
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
          background: "var(--mantine-color-body, Canvas)",
          border:
            "1px solid var(--mantine-color-default-border, color-mix(in srgb, currentColor 24%, transparent))",
          borderRadius: "var(--mantine-radius-default, 4px)",
          boxShadow: "var(--mantine-shadow-sm)",
        }}
      >
        {options.map((option) => (
          <Checkbox
            key={option.value}
            size="xs"
            label={option.label}
            checked={selected.includes(option.value)}
            onChange={(event) =>
              onToggle(option.value, event.currentTarget.checked)
            }
          />
        ))}
      </div>
    </details>
  );
}

const headerSlots: FilterHeaderSlots = {
  Search: HeaderSearch,
  Select: HeaderSelect,
  Range: HeaderRange,
  Multi: HeaderMulti,
};

export function FilterHeaderRow<TRow>(
  props: Readonly<FilterHeaderRowProps<TRow>>
) {
  return <FilterHeaderChrome {...props} slots={headerSlots} />;
}

export function FilterHeaderControl<TRow>(
  props: Readonly<FilterHeaderControlProps<TRow>>
) {
  return <FilterHeaderControlChrome {...props} slots={headerSlots} />;
}

function FindSearch({
  label,
  placeholder,
  value,
  focusRef,
  onChange,
  onKeyDown,
}: FindSearchProps) {
  return (
    <TextInput
      ref={focusRef}
      size="xs"
      type="search"
      aria-label={label}
      placeholder={placeholder}
      value={value}
      data-adapttable-part="find-input"
      onChange={(event) => onChange(event.currentTarget.value)}
      onKeyDown={onKeyDown}
      style={{ minWidth: "12em" }}
    />
  );
}

function FindButton({ label, part, kind, disabled, onClick }: FindButtonProps) {
  return (
    <ActionIcon
      type="button"
      size="sm"
      variant="default"
      data-adapttable-part={part}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      {FIND_GLYPH[kind]}
    </ActionIcon>
  );
}

export function FindBar(props: Readonly<FindBarProps>) {
  return (
    <FindBarChrome
      {...props}
      slots={{ Search: FindSearch, Button: FindButton }}
    />
  );
}

function RowEditButton({
  label,
  part,
  className,
  onClick,
}: RowEditButtonProps) {
  return (
    <Button
      type="button"
      size="xs"
      variant="default"
      data-adapttable-part={part}
      className={className}
      aria-label={label}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function RowEditActions<TRow>(
  props: Readonly<RowEditActionsProps<TRow>>
) {
  return <RowEditActionsChrome {...props} slots={{ Button: RowEditButton }} />;
}

function BatchButton({
  label,
  part,
  className,
  onClick,
}: BatchEditButtonProps) {
  return (
    <Button
      type="button"
      size="xs"
      variant="default"
      data-adapttable-part={part}
      className={className}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function BatchEditBar<TRow>(props: Readonly<BatchEditBarProps<TRow>>) {
  return <BatchEditBarChrome {...props} slots={{ Button: BatchButton }} />;
}

function TreeButton({
  label,
  expanded,
  loading,
  className,
  onClick,
}: TreeToggleButtonProps) {
  return (
    <ActionIcon
      type="button"
      size="sm"
      variant="subtle"
      color="gray"
      data-adapttable-part="tree-toggle"
      className={className}
      aria-expanded={expanded}
      aria-label={label}
      data-loading={loading ? "" : undefined}
      aria-busy={loading ? true : undefined}
      onClick={onClick}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          transform: expanded ? "rotate(90deg)" : "none",
          transition: "transform 150ms ease",
        }}
      >
        ▸
      </span>
    </ActionIcon>
  );
}

const treeSlots: TreeToggleSlots = { Button: TreeButton };

export function TreeToggle<TRow>(props: Readonly<TreeToggleProps<TRow>>) {
  return <TreeToggleChrome {...props} slots={treeSlots} />;
}

export function TreeCell<TRow>(props: Readonly<TreeCellProps<TRow>>) {
  return <TreeCellChrome {...props} slots={treeSlots} />;
}

function GroupToggleButton({
  label,
  expanded,
  className,
  onClick,
}: ColumnGroupToggleButtonProps) {
  return (
    <ActionIcon
      type="button"
      size="sm"
      variant="subtle"
      color="gray"
      data-adapttable-part="column-group-toggle"
      aria-expanded={expanded}
      aria-label={label}
      className={className}
      onClick={onClick}
    >
      {expanded ? "▼" : "▶"}
    </ActionIcon>
  );
}

export function ColumnGroupToggle(props: Readonly<ColumnGroupToggleProps>) {
  return (
    <ColumnGroupToggleChrome {...props} slots={{ Button: GroupToggleButton }} />
  );
}

function MoreButton({ label, onClick }: GroupMoreButtonSlotProps) {
  return (
    <Button
      type="button"
      size="xs"
      variant="subtle"
      data-adapttable-part="group-more"
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export function GroupMoreButton(props: Readonly<GroupMoreButtonProps>) {
  return <GroupMoreButtonChrome {...props} slots={{ Button: MoreButton }} />;
}

function ReorderHandle({
  label,
  pressed,
  dragging,
  className,
  dragProps,
  onKeyDown,
}: RowReorderHandleSlotProps) {
  return (
    <ActionIcon
      type="button"
      size="sm"
      variant="subtle"
      color="gray"
      data-adapttable-part="row-reorder-handle"
      data-adapttable-grip=""
      data-dragging={dragging ? "" : undefined}
      className={className}
      aria-label={label}
      aria-pressed={pressed}
      style={{ cursor: pressed ? "grabbing" : "grab" }}
      {...dragProps}
      onKeyDown={onKeyDown}
    >
      <GripIcon />
    </ActionIcon>
  );
}

export function RowReorderHandle<TRow>(
  props: Readonly<RowReorderHandleProps<TRow>>
) {
  return (
    <RowReorderHandleChrome {...props} slots={{ Handle: ReorderHandle }} />
  );
}

function ReorderMove({
  label,
  part,
  disabled,
  className,
  onClick,
}: RowReorderMoveButtonProps) {
  return (
    <ActionIcon
      type="button"
      size="sm"
      variant="subtle"
      color="gray"
      data-adapttable-part={part}
      aria-label={label}
      disabled={disabled}
      className={className}
      onClick={onClick}
    >
      {part === "row-reorder-up" ? "↑" : "↓"}
    </ActionIcon>
  );
}

export function RowReorderButtons<TRow>(
  props: Readonly<RowReorderButtonsProps<TRow>>
) {
  return <RowReorderButtonsChrome {...props} slots={{ Button: ReorderMove }} />;
}

function ActivateCell({
  title,
  className,
  saveStatus,
  dirty,
  activateRef,
  display,
  onDoubleClick,
  onClick,
  onKeyDown,
}: EditableCellActivateProps) {
  return (
    <button
      ref={activateRef}
      type="button"
      title={title}
      className={className}
      data-save={saveStatus}
      data-dirty={dirty ? "" : undefined}
      aria-busy={saveStatus === "saving" ? true : undefined}
      data-adapttable-part="edit-cell-activate"
      onDoubleClick={onDoubleClick}
      onClick={onClick}
      onKeyDown={onKeyDown}
      style={ACTIVATE_STYLE}
    >
      {display}
    </button>
  );
}

function EditGateButton({
  label,
  part,
  className,
  onMouseDown,
  onClick,
}: EditableCellButtonProps) {
  return (
    <Button
      type="button"
      size="xs"
      variant="default"
      data-adapttable-part={part}
      className={className}
      onMouseDown={onMouseDown}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

export const editableCellSlots: EditableCellSlots = {
  Activate: ActivateCell,
  Button: EditGateButton,
};
