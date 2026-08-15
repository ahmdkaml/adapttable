import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import { Button, NativeSelect, TextInput } from "@mantine/core";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <NativeSelect
      size="sm"
      label={label}
      aria-label={label}
      data-adapttable-part={part}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      data={options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      style={{ flex: "0 0 8.5rem", minWidth: "8.5rem" }}
    />
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  return (
    <TextInput
      size="sm"
      type={type}
      label={label}
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
      size="xs"
      variant="default"
      data-adapttable-part={part}
      onClick={onClick}
    >
      {label}
    </Button>
  );
}

const slots: FilterTreeSlots = {
  Select: TreeSelect,
  Input: TreeInput,
  Button: TreeButton,
};

/** Mantine AND/OR builder — kit NativeSelect / TextInput / Button. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
