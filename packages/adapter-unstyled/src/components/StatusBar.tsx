import {
  StatusBarChrome,
  type StatusBarChromeProps,
  type StatusBarSlotProps,
  type StatusBarSlots,
} from "@adapttable/core/adapter";
import { useMemo } from "react";

import type { DataTableClassNames } from "../types";
import { statsSlots } from "./SelectionStatsBar";

/** Unstyled status bar: semantic markup with class hooks, no styles. */
export function StatusBar(
  props: Readonly<
    Omit<StatusBarChromeProps, "slots"> & {
      classNames?: DataTableClassNames;
    }
  >
) {
  const { classNames, ...rest } = props;
  // The slot closes over the class map, so the spans inside the strip get
  // their hook without core's contract having to carry a class for them.
  // Memoized on the map alone: a new component identity every render would
  // remount the strip on every keystroke in the search box.
  const slots = useMemo<StatusBarSlots>(
    () => ({
      Bar: ({ items, stats, className }: StatusBarSlotProps) => (
        <div
          data-adapttable-part="status-bar"
          className={className}
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: "4px 16px",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {items.map((item) => (
            <span
              key={item.key}
              data-adapttable-part="status-item"
              data-status={item.key}
              className={classNames?.statusItem}
            >
              {item.text}
            </span>
          ))}
          {stats}
        </div>
      ),
      stats: statsSlots,
    }),
    [classNames]
  );
  return (
    <StatusBarChrome
      {...rest}
      className={classNames?.statusBar}
      slots={slots}
    />
  );
}
