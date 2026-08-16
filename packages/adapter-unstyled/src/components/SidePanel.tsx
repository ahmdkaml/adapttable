import {
  SidePanelChrome,
  type SidePanelChromeProps,
  type SidePanelCloseProps,
  type SidePanelFrameProps,
  type SidePanelSlots,
  type SidePanelTabProps,
} from "@adapttable/core/adapter";
import { useMemo } from "react";

import type { DataTableClassNames } from "../types";

/** Unstyled side panel: semantic markup with class hooks, no styles. */
export function SidePanel(
  props: Readonly<
    Omit<SidePanelChromeProps, "slots"> & {
      classNames?: DataTableClassNames;
    }
  >
) {
  const { classNames, ...rest } = props;
  // The slots close over the class map so each piece gets its hook without
  // core's contract carrying a class for it. Memoized on the map alone: a
  // new component identity every render would remount the open panel.
  const slots = useMemo<SidePanelSlots>(
    () => ({
      Frame: ({ children, side, className }: SidePanelFrameProps) => (
        <aside
          className={className}
          data-adapttable-part="side-panel"
          data-side={side}
          style={{ width: 280, flexShrink: 0 }}
        >
          {children}
        </aside>
      ),
      Tab: ({ panel, selected, buttonProps }: SidePanelTabProps) => (
        <button
          {...buttonProps}
          data-active={selected || undefined}
          className={classNames?.sidePanelTab}
        >
          {panel.label}
        </button>
      ),
      Close: ({ label, onClose }: SidePanelCloseProps) => (
        <button
          type="button"
          aria-label={label}
          data-adapttable-part="side-panel-close"
          className={classNames?.sidePanelClose}
          onClick={onClose}
        >
          ×
        </button>
      ),
    }),
    [classNames]
  );
  return (
    <SidePanelChrome
      {...rest}
      className={classNames?.sidePanel}
      slots={slots}
    />
  );
}
