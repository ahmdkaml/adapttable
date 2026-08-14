import {
  Checkbox as RadixCheckbox,
  Flex,
  Select,
  Text,
  Tooltip as RadixTooltip,
} from "@radix-ui/themes";
import { type ReactNode } from "react";

import type { RadixAccentColor } from "../types";

/**
 * Tooltip wrapper presenting the `label` + single-trigger-child contract the
 * adapter relies on. `disabled` (or an empty label) suppresses the tip and
 * renders the trigger untouched, so a disabled action with no reason keeps its
 * button. Radix Themes' `<Tooltip>` portals and positions itself.
 */
export function Tooltip({
  label,
  disabled,
  children,
}: Readonly<{
  label: ReactNode;
  disabled?: boolean;
  children: ReactNode;
}>) {
  if (disabled || label === "" || label == null) return <>{children}</>;
  return <RadixTooltip content={label}>{children}</RadixTooltip>;
}

/**
 * Checkbox wrapper presenting the single-component contract the adapter relies
 * on — a controlled `checked` / `indeterminate` state, a `toggle` callback, an
 * optional label (`children`), and an `aria-label` that names the control.
 * Radix Themes' `<Checkbox>` is already a single element (the `checkbox` role
 * target), so the wrapper just maps `indeterminate` onto Radix's
 * `"indeterminate"` checked value and forwards the toggle through
 * `onCheckedChange`.
 */
export function Checkbox({
  checked,
  indeterminate,
  onToggle,
  size,
  color,
  id,
  value,
  "aria-label": ariaLabel,
  children,
}: Readonly<{
  checked: boolean;
  indeterminate?: boolean;
  onToggle?: () => void;
  size?: "1" | "2" | "3";
  color?: RadixAccentColor;
  id?: string;
  value?: string;
  "aria-label"?: string;
  children?: ReactNode;
}>) {
  const box = (
    <RadixCheckbox
      id={id}
      value={value}
      size={size}
      color={color}
      aria-label={ariaLabel}
      checked={indeterminate ? "indeterminate" : checked}
      onCheckedChange={onToggle ? () => onToggle() : undefined}
    />
  );
  if (children == null) return box;
  // A labelled checkbox: the visible text and the box share one `<label>`, so
  // clicking the text toggles the box and the name reads through the label.
  return (
    <Text as="label" size="2">
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {box}
        {children}
      </span>
    </Text>
  );
}

/** One `<option>`-equivalent entry for {@link NativeSelect}. */
export interface SelectOption {
  value: string;
  label: ReactNode;
  disabled?: boolean;
}

/**
 * Sentinel that stands in for the empty value: Radix's `Select.Item` forbids
 * an empty-string `value`, so the wrapper maps `""` (the "no selection" /
 * placeholder / clear choice the headless layer writes) to this token on the
 * way down and back on the way up. Callers keep using `""` for "cleared".
 */
const EMPTY_VALUE = "__adapttable_empty__";

/**
 * Themed select recomposing Radix Themes' `Select.*` compound behind the
 * single-control API the adapter's toolbar, footer and auto-filter form use: a
 * controlled `value`, an `onValueChange(value)` callback, an optional
 * `placeholder`, and an `options` list. The empty value round-trips through a
 * sentinel so a placeholder / "clear" entry keeps working despite Radix's
 * non-empty-value rule.
 */
export function NativeSelect({
  size = "2",
  value,
  placeholder,
  onValueChange,
  options,
  width,
  "aria-label": ariaLabel,
  "data-adapttable-part": part,
}: Readonly<{
  size?: "1" | "2" | "3";
  value: string;
  placeholder?: string;
  onValueChange: (value: string) => void;
  options: readonly SelectOption[];
  width?: string;
  "aria-label"?: string;
  "data-adapttable-part"?: string;
}>) {
  return (
    <Select.Root
      size={size}
      value={value === "" ? EMPTY_VALUE : value}
      onValueChange={(next) => onValueChange(next === EMPTY_VALUE ? "" : next)}
    >
      <Select.Trigger
        aria-label={ariaLabel}
        data-adapttable-part={part}
        placeholder={placeholder}
        style={width ? { width } : undefined}
      />
      <Select.Content position="popper">
        {options.map((option) => (
          <Select.Item
            key={option.value === "" ? EMPTY_VALUE : option.value}
            value={option.value === "" ? EMPTY_VALUE : option.value}
            disabled={option.disabled}
          >
            {option.label}
          </Select.Item>
        ))}
      </Select.Content>
    </Select.Root>
  );
}

/**
 * Labelled form field: a small, tight label above its control — the Radix
 * Themes equivalent of the auto-filter form's Chakra `Field` pairing. The
 * control names itself through its own `aria-label` (the field's controls are
 * not native `<label>`-associable button-based selects), so this is a plain
 * visual stack, not a wrapping `<label>`.
 */
export function FormField({
  label,
  children,
}: Readonly<{ label: ReactNode; children: ReactNode }>) {
  return (
    <Flex direction="column" gap="1">
      <Text as="span" size="2">
        {label}
      </Text>
      {children}
    </Flex>
  );
}
