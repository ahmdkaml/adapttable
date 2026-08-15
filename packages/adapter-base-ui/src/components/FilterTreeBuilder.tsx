import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";

import { Button, TextField } from "../ui";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <select
      aria-label={label}
      data-adapttable-part={part}
      className="adapttable-btn"
      data-size="1"
      data-variant="outline"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  return (
    <TextField.Root
      size="1"
      type={type}
      aria-label={label}
      data-adapttable-part="filter-input"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      style={{ flex: "1 1 7rem", minWidth: "7rem" }}
    />
  );
}

function TreeButton({ label, part, onClick }: FilterTreeButtonProps) {
  return (
    <Button
      type="button"
      size="1"
      variant="soft"
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

/** Base UI AND/OR builder — compact kit row, no stacked field labels. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
