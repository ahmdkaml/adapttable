import {
  type ChecklistButtonProps,
  type ChecklistCheckboxProps,
  ChecklistChrome,
  type ChecklistFilterProps,
  type ChecklistSearchProps,
  type ChecklistSlots,
} from "@adapttable/core/adapter";
import { Button, Checkbox, TextInput } from "@mantine/core";

export type { ChecklistFilterProps };

function ChecklistSearch({ label, value, onChange }: ChecklistSearchProps) {
  return (
    <TextInput
      size="sm"
      type="search"
      label={label}
      aria-label={label}
      placeholder={label}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
      data-adapttable-part="filter-checklist-search"
    />
  );
}

function ChecklistButton({ label, onClick }: ChecklistButtonProps) {
  return (
    <Button type="button" size="xs" variant="default" onClick={onClick}>
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
      size="sm"
      className={className}
      checked={checked}
      onChange={(event) => onChange(event.currentTarget.checked)}
      label={
        <span data-adapttable-part="filter-checkbox">
          {label}{" "}
          <span
            data-adapttable-part="filter-checklist-count"
            className={countClassName}
          >
            {count}
          </span>
        </span>
      }
    />
  );
}

const slots: ChecklistSlots = {
  Search: ChecklistSearch,
  Button: ChecklistButton,
  Checkbox: ChecklistBox,
};

/** Mantine Excel-style checklist — kit Checkbox / TextInput / Button. */
export function ChecklistFilter<TRow>(
  props: Readonly<ChecklistFilterProps<TRow>>
) {
  return <ChecklistChrome {...props} slots={slots} />;
}
