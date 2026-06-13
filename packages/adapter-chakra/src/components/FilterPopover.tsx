import type { Direction, TableLabels } from "@adapttable/core";
import { Button, HStack, Popover, Portal, Stack, Text } from "@chakra-ui/react";
import type { ReactNode } from "react";

/** Props for {@link FilterPopover}. */
export interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  colorScheme?: string;
  dir?: Direction;
  /** The Filters trigger button — becomes the popover anchor. */
  children: ReactNode;
}

/**
 * Anchored filter card (the default filter container). Opens under the Filters
 * button with no backdrop — the background stays visible and interactive;
 * clicking outside or pressing Escape closes it. Pair with
 * `filtersMode="drawer"` for the slide-in panel instead.
 */
export function FilterPopover({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  colorScheme,
  dir = "ltr",
  children,
}: Readonly<FilterPopoverProps>) {
  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) onClose();
      }}
      positioning={{
        placement: dir === "rtl" ? "bottom-start" : "bottom-end",
      }}
      closeOnInteractOutside
      closeOnEscape
      lazyMount
      unmountOnExit
    >
      <Popover.Anchor asChild>{children}</Popover.Anchor>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            data-testid="adapttable-filter-popover"
            w="340px"
            maxW="90vw"
            dir={dir}
            zIndex="popover"
          >
            <Popover.Header border="0" pb={1}>
              <HStack justify="space-between" align="center">
                <Text fontWeight="semibold" fontSize="sm">
                  {labels.filters}
                </Text>
                <Button
                  size="xs"
                  variant="ghost"
                  colorPalette={colorScheme}
                  onClick={onClearFilters}
                  disabled={activeFilterCount === 0}
                >
                  {labels.clearAll}
                </Button>
              </HStack>
            </Popover.Header>
            <Popover.Body>
              <Stack gap={4}>{filters}</Stack>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
