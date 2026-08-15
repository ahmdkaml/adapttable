import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import type { ChangeEvent } from "react";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  className,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <select
      aria-label={label}
      data-adapttable-part={part}
      className={className}
      value={value}
      onChange={(event: ChangeEvent<HTMLSelectElement>) =>
        onChange(event.target.value)
      }
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

function TreeInput({
  label,
  value,
  type,
  className,
  onChange,
}: FilterTreeInputProps) {
  return (
    <input
      aria-label={label}
      data-adapttable-part="filter-input"
      className={className}
      type={type}
      value={value}
      onChange={(event: ChangeEvent<HTMLInputElement>) =>
        onChange(event.target.value)
      }
      style={{ flex: "1 1 7rem", minWidth: "7rem" }}
    />
  );
}

function TreeButton({
  label,
  part,
  className,
  onClick,
}: FilterTreeButtonProps) {
  return (
    <button
      type="button"
      data-adapttable-part={part}
      className={className}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

const slots: FilterTreeSlots = {
  Select: TreeSelect,
  Input: TreeInput,
  Button: TreeButton,
};

/** Native AND/OR builder — compact unlabeled row; native is unstyled's kit. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
