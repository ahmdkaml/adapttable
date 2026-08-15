import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import { Button, Input, InputNumber, Select, Typography } from "antd";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <label data-adapttable-part="filter-field">
      <Typography.Text data-adapttable-part="filter-label">
        {label}
      </Typography.Text>
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
        style={{ minWidth: "8.5rem" }}
      />
    </label>
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  if (type === "number") {
    return (
      <label data-adapttable-part="filter-field">
        <Typography.Text data-adapttable-part="filter-label">
          {label}
        </Typography.Text>
        <InputNumber
          size="small"
          aria-label={label}
          data-adapttable-part="filter-input"
          value={value === "" ? undefined : Number(value)}
          onChange={(next) => onChange(next == null ? "" : String(next))}
        />
      </label>
    );
  }
  return (
    <label data-adapttable-part="filter-field">
      <Typography.Text data-adapttable-part="filter-label">
        {label}
      </Typography.Text>
      <Input
        size="small"
        type={type}
        aria-label={label}
        data-adapttable-part="filter-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
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

/** Ant Design AND/OR builder — kit Select / Input / Button, popover-safe. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
