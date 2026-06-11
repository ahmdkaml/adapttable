import type { Direction, TableLabels } from "@adapttable/core";
import { Button, Flex, Popover } from "antd";
import { type ReactNode, useEffect, useRef } from "react";

/** Props for {@link FilterPopover}. */
export interface FilterPopoverProps {
  open: boolean;
  onClose: () => void;
  filters: ReactNode;
  activeFilterCount: number;
  onClearFilters: () => void;
  labels: Required<TableLabels>;
  dir?: Direction;
  /** The Filters trigger button — becomes the popover anchor. */
  children: ReactNode;
}

/**
 * Anchored filter card (the default filter container). A controlled antd
 * `Popover` anchored to the Filters button — no scrim, so the background stays
 * visible and interactive. Clicking outside the popover (and its trigger) or
 * pressing Escape closes it. Pair with `filtersMode="drawer"` for the slide-in
 * panel instead.
 */
export function FilterPopover({
  open,
  onClose,
  filters,
  activeFilterCount,
  onClearFilters,
  labels,
  dir = "ltr",
  children,
}: Readonly<FilterPopoverProps>) {
  const anchorRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const handlePointer = (event: MouseEvent) => {
      const target = event.target as Node | null;
      // Ignore clicks on the trigger (the toggle handles those) and inside the
      // floating popover content, which antd portals under `.ant-popover`.
      if (target && anchorRef.current?.contains(target)) return;
      if (target instanceof Element && target.closest(".ant-popover")) {
        return;
      }
      onClose();
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const content = (
    <div style={{ minWidth: 280, maxWidth: 360 }}>
      <Flex align="center" justify="space-between" gap="small">
        <span style={{ fontWeight: 600, fontSize: 14 }}>{labels.filters}</span>
        <Button
          size="small"
          type="link"
          disabled={activeFilterCount === 0}
          onClick={onClearFilters}
        >
          {labels.clearAll}
        </Button>
      </Flex>
      <div style={{ marginTop: 8 }}>{filters}</div>
    </div>
  );

  return (
    <Popover
      open={open}
      trigger={[]}
      placement={dir === "rtl" ? "bottomLeft" : "bottomRight"}
      content={content}
      styles={{ body: { padding: 12 } }}
    >
      <span ref={anchorRef}>{children}</span>
    </Popover>
  );
}
