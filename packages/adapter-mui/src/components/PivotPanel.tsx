/** The pivot configuration panel, in MUI. */
import {
  type PivotAddProps,
  type PivotAggProps,
  type PivotFieldProps,
  PivotPanelChrome,
  type PivotPanelChromeProps,
  type PivotPanelSlots,
  type PivotPanelSurfaceProps,
  type PivotZoneProps,
} from "@adapttable/core/adapter";
import { Button, MenuItem, Stack, TextField, Typography } from "@mui/material";

const slots: PivotPanelSlots = {
  Surface: ({ children, className, ...rest }: PivotPanelSurfaceProps) => (
    <Stack spacing={1.5} className={className} {...rest}>
      {children}
    </Stack>
  ),
  Zone: ({ label, children, zone, ...rest }: PivotZoneProps) => (
    <Stack
      component="fieldset"
      spacing={0.5}
      data-pivot-zone={zone}
      sx={{ border: 0, p: 0, m: 0 }}
      {...rest}
    >
      <Typography component="legend" variant="caption" color="text.secondary">
        {label}
      </Typography>
      {children}
    </Stack>
  ),
  Field: ({
    label,
    onMoveUp,
    onMoveDown,
    onRemove,
    moveUpLabel,
    moveDownLabel,
    removeLabel,
    aggregation,
    ...rest
  }: PivotFieldProps) => (
    <Stack
      direction="row"
      spacing={0.5}
      sx={{ alignItems: "center" }}
      {...rest}
    >
      <Typography variant="body2" sx={{ flex: 1 }}>
        {label}
      </Typography>
      {aggregation}
      <Button
        size="small"
        aria-label={`${moveUpLabel}: ${label}`}
        disabled={!onMoveUp}
        onClick={onMoveUp}
      >
        {"↑"}
      </Button>
      <Button
        size="small"
        aria-label={`${moveDownLabel}: ${label}`}
        disabled={!onMoveDown}
        onClick={onMoveDown}
      >
        {"↓"}
      </Button>
      <Button
        size="small"
        aria-label={`${removeLabel}: ${label}`}
        onClick={onRemove}
      >
        {"✕"}
      </Button>
    </Stack>
  ),
  Add: ({ label, options, onAdd }: PivotAddProps) => (
    <TextField
      select
      size="small"
      label={label}
      value=""
      disabled={options.length === 0}
      slotProps={{ htmlInput: { "aria-label": label } }}
      onChange={(event) => {
        if (event.target.value) onAdd(event.target.value);
      }}
    >
      {options.map((option) => (
        <MenuItem key={option.key} value={option.key}>
          {option.label}
        </MenuItem>
      ))}
    </TextField>
  ),
  Agg: ({ label, value, options, onChange }: PivotAggProps) => (
    <TextField
      select
      size="small"
      value={value}
      sx={{ width: 100 }}
      slotProps={{ htmlInput: { "aria-label": label } }}
      onChange={(event) => {
        onChange(event.target.value as (typeof options)[number]);
      }}
    >
      {options.map((option) => (
        <MenuItem key={option} value={option}>
          {option}
        </MenuItem>
      ))}
    </TextField>
  ),
};

/** Configure a pivot: three zones, and buttons that move fields between them. */
export function PivotPanel(
  props: Readonly<Omit<PivotPanelChromeProps, "slots">>
) {
  return <PivotPanelChrome {...props} slots={slots} />;
}
