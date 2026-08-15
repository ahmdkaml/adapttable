import {
  type ChecklistButtonProps,
  type ChecklistCheckboxProps,
  ChecklistChrome,
  type ChecklistFilterProps,
  type ChecklistSearchProps,
  type ChecklistSlots,
} from "@adapttable/core/adapter";
import { Button, Input } from "@chakra-ui/react";

import { Checkbox } from "./primitives";

export type { ChecklistFilterProps };

function ChecklistSearch({ label, value, onChange }: ChecklistSearchProps) {
  return (
    <Input
      size="sm"
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
    <Button type="button" size="xs" variant="outline" onClick={onClick}>
      {label}
    </Button>
  );
}

function ChecklistBox({
  label,
  count,
  checked,
  countClassName,
  onChange,
}: ChecklistCheckboxProps) {
  return (
    <Checkbox size="sm" checked={checked} onToggle={() => onChange(!checked)}>
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

/** Chakra checklist — wrapping kit checkboxes, not one value per row. */
export function ChecklistFilter<TRow>(
  props: Readonly<ChecklistFilterProps<TRow>>
) {
  return <ChecklistChrome {...props} slots={slots} />;
}
