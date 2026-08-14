/**
 * The reorder affordance kits drop into a reserved column (desktop grip) or
 * a card footer (mobile up/down). Markup lives here so eight adapters cannot
 * drift on the accessible name, the grab keyboard, or the part hooks.
 */
import type { ReactElement } from "react";

import { LiveRegion } from "../a11y/LiveRegion";
import { GripIcon } from "../columns/icons";
import type { RowReorderLabels, RowReorderState } from "./rowReorder";

const BUTTON = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.75em",
  height: "1.75em",
  flexShrink: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "grab",
} as const;

/** Props for {@link RowReorderHandle}. */
export interface RowReorderHandleProps<TRow> {
  reorder: RowReorderState<TRow>;
  labels: RowReorderLabels;
  rowId: string;
  localIndex: number;
  row: TRow;
  windowStart: number;
  rowCount: number;
  className?: string;
}

/**
 * Desktop grip: pointer drag plus Space-lift keyboard. Kits wrap this in
 * their own `<td>` / `<th>` so the cell looks like the rest of the row.
 */
export function RowReorderHandle<TRow>({
  reorder,
  labels,
  rowId,
  localIndex,
  row,
  windowStart,
  rowCount,
  className,
}: Readonly<RowReorderHandleProps<TRow>>): ReactElement {
  const lifted = reorder.isLifted(rowId);
  return (
    <button
      type="button"
      data-adapttable-part="row-reorder-handle"
      data-adapttable-grip=""
      data-dragging={lifted ? "" : undefined}
      className={className}
      aria-label={labels.reorderRow}
      aria-pressed={lifted}
      style={{ ...BUTTON, cursor: lifted ? "grabbing" : "grab" }}
      {...reorder.dragProps(rowId, localIndex)}
      onKeyDown={(event) => {
        reorder.handleKeyDown(
          event,
          rowId,
          localIndex,
          row,
          windowStart,
          rowCount
        );
      }}
    >
      <GripIcon />
    </button>
  );
}

/** Props for {@link RowReorderButtons}. */
export interface RowReorderButtonsProps<TRow> {
  reorder: RowReorderState<TRow>;
  labels: RowReorderLabels;
  localIndex: number;
  row: TRow;
  windowStart: number;
  rowCount: number;
  className?: string;
  upClassName?: string;
  downClassName?: string;
}

/**
 * Mobile up/down — a drag handle on a card is unusable. Each press swaps
 * with the neighbour; the ends disable rather than wrapping.
 */
export function RowReorderButtons<TRow>({
  reorder,
  labels,
  localIndex,
  row,
  windowStart,
  rowCount,
  className,
  upClassName,
  downClassName,
}: Readonly<RowReorderButtonsProps<TRow>>): ReactElement {
  return (
    <span data-adapttable-part="row-reorder-buttons" className={className}>
      <button
        type="button"
        data-adapttable-part="row-reorder-up"
        aria-label={labels.moveRowUp}
        disabled={localIndex <= 0}
        className={upClassName}
        style={BUTTON}
        onClick={() => {
          reorder.moveBy(localIndex, -1, row, windowStart, rowCount);
        }}
      >
        ↑
      </button>
      <button
        type="button"
        data-adapttable-part="row-reorder-down"
        aria-label={labels.moveRowDown}
        disabled={localIndex >= rowCount - 1}
        className={downClassName}
        style={BUTTON}
        onClick={() => {
          reorder.moveBy(localIndex, 1, row, windowStart, rowCount);
        }}
      >
        ↓
      </button>
    </span>
  );
}

/** The live region for row reorder. Kits mount this only when reorder is armed. */
export function RowReorderAnnouncer(
  props: Readonly<{ announcement: string }>
): ReactElement {
  return (
    <LiveRegion part="row-reorder-announcer">{props.announcement}</LiveRegion>
  );
}
