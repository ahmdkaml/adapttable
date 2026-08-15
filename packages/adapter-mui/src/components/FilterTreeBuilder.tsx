import {
  type FilterTreeBuilderProps,
  type FilterTreeButtonProps,
  FilterTreeChrome,
  type FilterTreeInputProps,
  type FilterTreeSelectProps,
  type FilterTreeSlots,
} from "@adapttable/core/adapter";
import { Button, MenuItem, TextField } from "@mui/material";

export type { FilterTreeBuilderProps };

function TreeSelect({
  label,
  value,
  part,
  options,
  onChange,
}: FilterTreeSelectProps) {
  return (
    <TextField
      select
      size="small"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        htmlInput: { "aria-label": label, "data-adapttable-part": part },
        select: { native: false, MenuProps: { disablePortal: true } },
      }}
      sx={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
    >
      {options.map((option) => (
        <MenuItem key={option.value} value={option.value}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  );
}

function TreeInput({ label, value, type, onChange }: FilterTreeInputProps) {
  return (
    <TextField
      size="small"
      type={type}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        htmlInput: {
          "aria-label": label,
          "data-adapttable-part": "filter-input",
        },
      }}
      sx={{ flex: "1 1 7rem", minWidth: "7rem" }}
    />
  );
}

function TreeButton({ label, part, onClick }: FilterTreeButtonProps) {
  return (
    <Button
      type="button"
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

/** MUI AND/OR builder — compact kit Select / TextField / Button, no stacked labels. */
export function FilterTreeBuilder<TRow>(
  props: Readonly<FilterTreeBuilderProps<TRow>>
) {
  return <FilterTreeChrome {...props} slots={slots} />;
}
