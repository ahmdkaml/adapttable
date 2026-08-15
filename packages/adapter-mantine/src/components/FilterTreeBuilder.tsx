import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeDisclosureProps,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import { Button, Select, TextInput } from "@mantine/core";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <Select
      size="xs"
      aria-label={label}
      data-adapttable-part={part}
      value={value}
      onChange={(next) => {
        if (next) onChange(next);
      }}
      data={options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      allowDeselect={false}
      style={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
    />
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  return (
    <TextInput
      size="xs"
      type={type}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      data-adapttable-part="filter-input"
      style={{ flex: "1 1 7rem", minWidth: "7rem" }}
    />
  );
}

function TreeButton({ label, part, onClick }: FilterTreeButtonProps) {
  return (
    <Button
      type="button"
      size="compact-xs"
      variant="default"
      data-adapttable-part={part}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

function TreeDisclosure({
  label,
  expanded,
  className,
  summaryClassName,
  children,
  onExpandedChange,
}: FilterTreeDisclosureProps) {
  return (
    <div
      className={className}
      data-adapttable-part="filter-tree"
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
        marginBlockStart: 4,
        paddingBlockStart: 8,
        borderBlockStart: "1px solid var(--mantine-color-default-border)",
      }}
    >
      <Button
        type="button"
        size="compact-sm"
        variant="subtle"
        fullWidth
        justify="space-between"
        className={summaryClassName}
        aria-expanded={expanded}
        data-adapttable-part="filter-tree-summary"
        onClick={() => onExpandedChange(!expanded)}
      >
        {label}
        <span aria-hidden>{expanded ? "▴" : "▾"}</span>
      </Button>
      {expanded ? children : null}
    </div>
  );
}

const slots: FilterTreeSlots = {
  Select: TreeSelect,
  Input: TreeInput,
  Button: TreeButton,
  Disclosure: TreeDisclosure,
};

/** Mantine AND/OR builder — compact kit Select / TextInput / Button, no stacked labels. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
