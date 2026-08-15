/** The filters drawer — the backdrop-ed alternative to the popover. */
import { type Direction, type TableLabels } from "@adapttable/core";
import { Button, Dialog, Flex } from "@radix-ui/themes";
import { type ReactNode } from "react";

import type { RadixAccentColor } from "../types";

/** Filters dialog (Radix has no Drawer — a real modal with backdrop + focus trap). */
export function FilterDrawer({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  accentColor,
  dir = "ltr",
}: Readonly<{
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  accentColor?: RadixAccentColor;
  dir?: Direction;
}>) {
  // Radix Themes ships no Drawer primitive, so the drawer is a Dialog restyled
  // into a full-height panel pinned to the inline-end edge (RTL-correct via
  // logical insets) that slides in from that edge — instead of the centered
  // modal Dialog renders by default. Injected as a <style> because keyframes
  // can't be declared inline; the two-class selector + later source order
  // outrank Radix's own centering/animation rules without `!important`.
  // The overlay itself has no z-index, so a sticky page header (z-index 40
  // on the showcase nav) paints over it unless we lift the overlay.
  const drawerClass = "adapttable-radix-drawer";
  const fromEdge = dir === "rtl" ? "-100%" : "100%";
  const drawerCss = `
.rt-DialogOverlay:has(.${drawerClass}){z-index:10050}
.${drawerClass}{position:fixed;inset-block:0;inset-inline-end:0;inset-inline-start:auto;margin:0;width:min(420px,100vw);max-width:none;height:100dvh;max-height:100dvh;border-radius:0;display:flex;flex-direction:column}
.${drawerClass}[data-state="open"]{animation:${drawerClass}-in 220ms cubic-bezier(.32,.72,0,1)}
.${drawerClass}[data-state="closed"]{animation:${drawerClass}-out 200ms cubic-bezier(.32,.72,0,1)}
@keyframes ${drawerClass}-in{from{transform:translateX(${fromEdge})}to{transform:translateX(0)}}
@keyframes ${drawerClass}-out{from{transform:translateX(0)}to{transform:translateX(${fromEdge})}}
@media(prefers-reduced-motion:reduce){.${drawerClass}[data-state]{animation-duration:1ms}}
`;
  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <Dialog.Content dir={dir} className={drawerClass}>
        <style>{drawerCss}</style>
        <Dialog.Title>{labels.filters}</Dialog.Title>
        <Flex
          direction="column"
          gap="4"
          mt="3"
          style={{ flex: 1, minHeight: 0, overflowY: "auto" }}
        >
          {filters}
        </Flex>
        <Flex justify="between" mt="4">
          <Button
            variant="ghost"
            color="gray"
            onClick={onClearFilters}
            disabled={activeFilterCount === 0}
          >
            {labels.clearAll}
          </Button>
          <Button color={accentColor} onClick={onClose}>
            {labels.filtersDone}
          </Button>
        </Flex>
      </Dialog.Content>
    </Dialog.Root>
  );
}
