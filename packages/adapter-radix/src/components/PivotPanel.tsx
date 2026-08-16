/** The pivot configuration panel, in Radix Themes. */
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
import { Button, Flex, Text } from "@radix-ui/themes";

import { NativeSelect } from "./primitives";

const slots: PivotPanelSlots = {
  Surface: ({ children, className, ...rest }: PivotPanelSurfaceProps) => (
    <Flex className={className} {...rest}>
      {children}
    </Flex>
  ),
  Zone: ({ label, children, zone, ...rest }: PivotZoneProps) => (
    <fieldset
      data-pivot-zone={zone}
      style={{ border: 0, padding: 0, margin: 0 }}
      {...rest}
    >
      <legend>
        <Text size="1" color="gray">
          {label}
        </Text>
      </legend>
      <Flex direction="column" gap="1">
        {children}
      </Flex>
    </fieldset>
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
    <Flex {...rest}>
      <Text size="2">{label}</Text>
      {aggregation}
      <Button
        size="1"
        variant="soft"
        aria-label={`${moveUpLabel}: ${label}`}
        disabled={!onMoveUp}
        onClick={onMoveUp}
      >
        {"\u2191"}
      </Button>
      <Button
        size="1"
        variant="soft"
        aria-label={`${moveDownLabel}: ${label}`}
        disabled={!onMoveDown}
        onClick={onMoveDown}
      >
        {"\u2193"}
      </Button>
      <Button
        size="1"
        variant="soft"
        aria-label={`${removeLabel}: ${label}`}
        onClick={onRemove}
      >
        {"\u2715"}
      </Button>
    </Flex>
  ),
  Add: ({ label, options, onAdd }: PivotAddProps) => (
    <NativeSelect
      aria-label={label}
      value=""
      placeholder={label}
      options={options.map((option) => ({
        value: option.key,
        label: option.label,
      }))}
      onValueChange={(next) => {
        if (next) onAdd(next);
      }}
    />
  ),
  Agg: ({ label, value, options, onChange }: PivotAggProps) => (
    <NativeSelect
      aria-label={label}
      value={value}
      options={options.map((option) => ({ value: option, label: option }))}
      onValueChange={(next) => {
        onChange(next as (typeof options)[number]);
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
