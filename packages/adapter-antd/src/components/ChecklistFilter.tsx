import {
  type ChecklistButtonProps,
  type ChecklistCheckboxProps,
  ChecklistChrome,
  type ChecklistFilterProps,
  type ChecklistSearchProps,
  type ChecklistSlots,
} from "@adapttable/core/adapter";
import { Button, Checkbox, Input } from "antd";

export type { ChecklistFilterProps };

function ChecklistSearch({ label, value, onChange }: ChecklistSearchProps) {
  return (
    <Input
      size="small"
      type="search"
      aria-label={label}
      placeholder={label}
      data-adapttable-part="filter-checklist-search"
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}

function ChecklistButton({ label, onClick }: ChecklistButtonProps) {
  return (
    <Button type="default" size="small" onClick={onClick}>
      {label}
    </Button>
  );
}

function ChecklistBox({
  label,
  count,
  checked,
  className,
  countClassName,
  onChange,
}: ChecklistCheckboxProps) {
  return (
    <Checkbox
      className={className}
      checked={checked}
      onChange={(event) => onChange(event.target.checked)}
    >
      <span data-adapttable-part="filter-checkbox">
        {label}{" "}
        <span
          data-adapttable-part="filter-checklist-count"
          className={countClassName}
        >
          {count}
        </span>
      </span>
    </Checkbox>
  );
}

const slots: ChecklistSlots = {
  Search: ChecklistSearch,
  Button: ChecklistButton,
  Checkbox: ChecklistBox,
};

/** Ant Design checklist — wrapping kit checkboxes, not one value per row. */
export function ChecklistFilter<TRow>(
  props: Readonly<ChecklistFilterProps<TRow>>
) {
  return <ChecklistChrome {...props} slots={slots} />;
}
