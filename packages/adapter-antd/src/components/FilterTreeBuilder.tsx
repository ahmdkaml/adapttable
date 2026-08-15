import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import { Button, Input, InputNumber, Select } from "antd";

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
      size="small"
      aria-label={label}
      data-adapttable-part={part}
      value={value}
      onChange={onChange}
      getPopupContainer={(trigger: HTMLElement) => trigger.parentElement!}
      options={options.map((option) => ({
        value: option.value,
        label: option.label,
      }))}
      style={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
    />
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  if (type === "number") {
    return (
      <InputNumber
        size="small"
        aria-label={label}
        data-adapttable-part="filter-input"
        value={value === "" ? undefined : Number(value)}
        onChange={(next) => onChange(next == null ? "" : String(next))}
        style={{ flex: "1 1 7rem", minWidth: "7rem" }}
      />
    );
  }
  return (
    <Input
      size="small"
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
      type="default"
      size="small"
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

/** Ant Design AND/OR builder — compact kit Select / Input / Button, no stacked labels. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
