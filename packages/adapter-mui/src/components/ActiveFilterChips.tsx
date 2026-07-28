/** Removable chips for the active filters. */
import { type ActiveFilterChip, type TableLabels } from "@adapttable/core";
import { Button, Chip, Stack } from "@mui/material";

/** Removable MUI chips. */
export function Chips({
  chips,
  onClearAll,
  labels,
}: Readonly<{
  chips: readonly ActiveFilterChip[];
  onClearAll: () => void;
  labels: Required<TableLabels>;
}>) {
  if (chips.length === 0) return null;
  return (
    <Stack
      direction="row"
      spacing={0.5}
      useFlexGap
      component="ul"
      aria-label={labels.filters}
      sx={{ listStyle: "none", p: 0, m: 0, flexWrap: "wrap" }}
    >
      {chips.map((chip) => (
        <li key={chip.key}>
          <Chip
            label={chip.label}
            size="small"
            onDelete={chip.onRemove}
            deleteIcon={
              <span aria-label={`${labels.clearAll}: ${chip.label}`}>×</span>
            }
          />
        </li>
      ))}
      <li>
        <Button size="small" onClick={onClearAll}>
          {labels.clearAll}
        </Button>
      </li>
    </Stack>
  );
}
