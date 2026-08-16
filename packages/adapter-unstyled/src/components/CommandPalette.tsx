import {
  CommandPaletteChrome,
  type CommandPaletteChromeProps,
  type CommandPaletteInputProps,
  type CommandPaletteItemProps,
  type CommandPaletteSlots,
  type CommandPaletteSurfaceProps,
} from "@adapttable/core/adapter";
import { useMemo } from "react";

import type { DataTableClassNames } from "../types";

function Surface({
  label,
  onClose,
  children,
  className,
}: CommandPaletteSurfaceProps) {
  return (
    <div
      // No part name: four kits paint this with their own Dialog's
      // backdrop and could not tag it, so it is not contract.
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-start",
        justifyContent: "center",
        paddingTop: "12vh",
        zIndex: 1000,
      }}
      // A presentational scrim, not a control: the dialog inside owns
      // every interaction, and Escape closes from there. Clicking outside
      // is a convenience, so it is a click on a non-interactive element by
      // design rather than an unlabelled button.
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className={className}
        data-adapttable-part="command-palette"
        style={{ minWidth: 360, maxWidth: 520, width: "100%" }}
      >
        {children}
      </div>
    </div>
  );
}

/**
 * Unstyled command palette: semantic markup with class hooks, no styles.
 *
 * The slots close over the class map rather than reading it from a module
 * binding — two tables with different maps on one page would otherwise
 * share whichever rendered last.
 */
export function CommandPalette(
  props: Readonly<
    Omit<CommandPaletteChromeProps, "slots"> & {
      classNames?: DataTableClassNames;
    }
  >
) {
  const { classNames, ...rest } = props;
  const inputClass = classNames?.commandInput;
  const itemClass = classNames?.commandItem;
  const emptyClass = classNames?.commandEmpty;
  const slots = useMemo<CommandPaletteSlots>(
    () => ({
      Surface,
      Input: ({ inputProps }: CommandPaletteInputProps) => {
        const { onChange, ref, ...bind } = inputProps;
        return (
          <input
            {...bind}
            ref={ref}
            className={inputClass}
            onChange={(event) => {
              onChange(event.target.value);
            }}
          />
        );
      },
      Item: ({ command, active, itemProps }: CommandPaletteItemProps) => (
        <button
          type="button"
          {...itemProps}
          data-active={active || undefined}
          disabled={command.disabled}
          className={itemClass}
        >
          {command.label}
        </button>
      ),
      Empty: ({ message }: Readonly<{ message: string }>) => (
        <p data-adapttable-part="command-empty" className={emptyClass}>
          {message}
        </p>
      ),
    }),
    [emptyClass, inputClass, itemClass]
  );
  return (
    <CommandPaletteChrome
      {...rest}
      className={classNames?.commandPalette}
      slots={slots}
    />
  );
}
