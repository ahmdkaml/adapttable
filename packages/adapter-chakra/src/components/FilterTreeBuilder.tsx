import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import { Button, Input } from "@chakra-ui/react";

import { NativeSelect } from "./primitives";

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
      aria-label={label}
      data-adapttable-part={part}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      flex="1 1 8.5rem"
      minW="8.5rem"
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </NativeSelect>
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  return (
    <Input
      size="sm"
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
      size="xs"
      variant="outline"
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

/** Chakra AND/OR builder — compact kit controls, no stacked field labels. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
