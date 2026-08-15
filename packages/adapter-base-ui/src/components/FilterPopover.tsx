import type { Direction, TableLabels } from "@adapttable/core";
import { Popover } from "@base-ui/react/popover";
import { isValidElement, type ReactElement, type ReactNode } from "react";

import type { BaseUiAccentColor } from "../types";
import { Button, Flex, Text } from "../ui";

/** Props for {@link FilterPopover}. */
export interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  accentColor?: BaseUiAccentColor;
  dir?: Direction;
  /** The Filters trigger button — becomes the popover anchor. */
  children: ReactNode;
}

/**
 * Anchored filter card (the default filter container). Opens under the Filters
 * button with no backdrop — the background stays visible and interactive;
 * clicking outside or pressing Escape closes it. Pair with
 * `filtersMode="drawer"` for the modal panel instead.
 */
export function FilterPopover({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  accentColor,
  dir = "ltr",
  children,
}: Readonly<FilterPopoverProps>) {
  const trigger = isValidElement(children) ? (
    <Popover.Trigger render={children as ReactElement} />
  ) : (
    <Popover.Trigger>{children}</Popover.Trigger>
  );
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      {trigger}
      <Popover.Portal>
        <Popover.Positioner
          className="adapttable-popup-positioner"
          side="bottom"
          align={dir === "rtl" ? "start" : "end"}
          sideOffset={8}
          // The filter form GROWS while it is open (picking the "between"
          // operator reveals a second bound input). With the default
          // flip behaviour Base UI answered that by throwing the whole
          // panel above the trigger — it covered the page header and the
          // control the user had just clicked. `shift` keeps it anchored
          // below and slides it just enough to stay on screen; the popup's
          // own max-height + overflow handle the extreme case.
          collisionAvoidance={{
            side: "shift",
            align: "shift",
            fallbackAxisSide: "none",
          }}
        >
          <Popover.Popup
            data-testid="adapttable-filter-popover"
            aria-label={labels.filters}
            dir={dir}
            className="adapttable-popup"
            style={{ width: 380, maxWidth: "90vw" }}
          >
            <Flex direction="column" gap="3">
              <Flex justify="between" align="center">
                <Text weight="bold" size="2">
                  {labels.filters}
                </Text>
                <Button
                  size="1"
                  variant="ghost"
                  color={accentColor}
                  onClick={onClearFilters}
                  disabled={activeFilterCount === 0}
                >
                  {labels.clearAll}
                </Button>
              </Flex>
              <Flex direction="column" gap="4">
                {filters}
              </Flex>
            </Flex>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
