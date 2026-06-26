import type { Direction, TableLabels } from "@adapttable/core";
import { Button, Flex, Popover, Text } from "@radix-ui/themes";
import type { ReactNode } from "react";

import type { RadixAccentColor } from "../types";

/** Props for {@link FilterPopover}. */
export interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  accentColor?: RadixAccentColor;
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
  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Popover.Trigger>{children}</Popover.Trigger>
      <Popover.Content
        data-testid="adapttable-filter-popover"
        aria-label={labels.filters}
        align={dir === "rtl" ? "start" : "end"}
        side="bottom"
        width="340px"
        maxWidth="90vw"
        dir={dir}
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
      </Popover.Content>
    </Popover.Root>
  );
}
