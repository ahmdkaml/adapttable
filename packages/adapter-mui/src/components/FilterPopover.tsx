import type { Direction, TableLabels } from "@adapttable/core";
import {
  Box,
  Button,
  ClickAwayListener,
  Paper,
  Popper,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useEffect } from "react";

/** Props for {@link FilterPopover}. */
export interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  /** The element the popover is anchored to (the Filters button). */
  anchorEl: HTMLElement | null;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  dir?: Direction;
}

/**
 * Anchored filter card (the default filter container). Opens under the Filters
 * button. Built on a non-modal `Popper` (+ `ClickAwayListener`) rather than the
 * Modal-based `Popover`, so it renders NO backdrop/scrim — the background stays
 * visible and interactive. Closes on outside click or Escape. Placement is
 * `bottom-end` (flips to `bottom-start` for RTL). Pair with
 * `filtersMode="drawer"` for the slide-in panel instead.
 */
export function FilterPopover({
  open,
  onClose,
  anchorEl,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  dir = "ltr",
}: Readonly<FilterPopoverProps>) {
  // Escape must close the popover wherever focus sits (e.g. still on the
  // Filters trigger) — a keydown on the card alone misses that case.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      onClose();
      // Escape strands keyboard focus inside the removed card — hand it back
      // to the trigger (the anchor IS the Filters button).
      anchorEl?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose, anchorEl]);
  return (
    <Popper
      open={open && anchorEl !== null}
      anchorEl={anchorEl}
      placement={dir === "rtl" ? "bottom-start" : "bottom-end"}
      modifiers={[{ name: "offset", options: { offset: [0, 4] } }]}
      style={{ zIndex: 1300 }}
    >
      <ClickAwayListener mouseEvent="onMouseDown" onClickAway={onClose}>
        <Paper
          elevation={8}
          sx={{
            width: 360,
            maxWidth: "calc(100vw - 32px)",
            // The form grows while open, and with enough filters it outgrows
            // the window. Pinned below the trigger it has to stop at the
            // viewport edge, or its lower fields are painted off-screen and
            // cannot be reached.
            maxHeight: "min(70vh, 560px)",
            overflowY: "auto",
            borderRadius: 2,
          }}
        >
          <Box sx={{ p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
            <Stack
              direction="row"
              sx={{ justifyContent: "space-between", alignItems: "center" }}
            >
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                {labels.filters}
              </Typography>
              <Button
                size="small"
                onClick={onClearFilters}
                disabled={activeFilterCount === 0}
              >
                {labels.clearAll}
              </Button>
            </Stack>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
              {filters}
            </Box>
          </Box>
        </Paper>
      </ClickAwayListener>
    </Popper>
  );
}
