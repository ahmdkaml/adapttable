/** The pivot configuration panel, in Mantine. */
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
import { Button, Group, Select, Stack, Text } from "@mantine/core";

const slots: PivotPanelSlots = {
  Surface: ({ children, className, ...rest }: PivotPanelSurfaceProps) => (
    <Stack gap="sm" className={className} {...rest}>
      {children}
    </Stack>
  ),
  Zone: ({ label, children, zone, ...rest }: PivotZoneProps) => (
    <Stack gap={4} component="fieldset" data-pivot-zone={zone} {...rest}>
      <Text component="legend" fz="xs" fw={600} tt="uppercase" c="dimmed">
        {label}
      </Text>
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
    <Group gap={4} wrap="nowrap" {...rest}>
      <Text fz="sm" style={{ flex: 1 }}>
        {label}
      </Text>
      {aggregation}
      <Button
        size="compact-xs"
        variant="default"
        aria-label={`${moveUpLabel}: ${label}`}
        disabled={!onMoveUp}
        onClick={onMoveUp}
      >
        {"↑"}
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        aria-label={`${moveDownLabel}: ${label}`}
        disabled={!onMoveDown}
        onClick={onMoveDown}
      >
        {"↓"}
      </Button>
      <Button
        size="compact-xs"
        variant="default"
        aria-label={`${removeLabel}: ${label}`}
        onClick={onRemove}
      >
        {"✕"}
      </Button>
    </Group>
  ),
  Add: ({ label, options, onAdd }: PivotAddProps) => (
    <Select
      aria-label={label}
      placeholder={label}
      size="xs"
      value={null}
      disabled={options.length === 0}
      data={options.map((option) => ({
        value: option.key,
        label: option.label,
      }))}
      comboboxProps={{ withinPortal: false }}
      onChange={(next) => {
        if (next) onAdd(next);
      }}
    />
  ),
  Agg: ({ label, value, options, onChange }: PivotAggProps) => (
    <Select
      aria-label={label}
      size="xs"
      w={90}
      value={value}
      allowDeselect={false}
      data={options.map((option) => ({ value: option, label: option }))}
      comboboxProps={{ withinPortal: false }}
      onChange={(next) => {
        if (next) onChange(next);
      }}
    />
  ),
};

/** Configure a pivot: three zones, and buttons that move fields between them. */
export function PivotPanel(
  props: Readonly<Omit<PivotPanelChromeProps, "slots">>
) {
  return <PivotPanelChrome {...props} slots={slots} />;
}
