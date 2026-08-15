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
  fieldClassName,
  labelClassName,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <label data-adapttable-part="filter-field" className={fieldClassName}>
      <span data-adapttable-part="filter-label" className={labelClassName}>
        {label}
      </span>
      <select
        aria-label={label}
        data-adapttable-part={part}
        className={className}
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value)
        }
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function TreeInput({
  label,
  value,
  type,
  className,
  fieldClassName,
  labelClassName,
  onChange,
}: FilterTreeInputProps) {
  return (
    <label data-adapttable-part="filter-field" className={fieldClassName}>
      <span data-adapttable-part="filter-label" className={labelClassName}>
        {label}
      </span>
      <input
        aria-label={label}
        data-adapttable-part="filter-input"
        className={className}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
      />
    </label>
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

/** Native AND/OR builder — unstyled's kit is semantic HTML. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
