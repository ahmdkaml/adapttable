/**
 * The little square on the selection's corner that carries values onward.
 *
 * It lives in core rather than in eight adapters for the same reason the
 * announcer does: every kit needs the identical hit target, the identical
 * corner, and the identical RTL behaviour, and eight copies of that is eight
 * chances to differ. Colour is the one thing a kit may want its own — the
 * square paints in `currentColor`, so it already matches whatever the cell's
 * text does, and `--adapttable-fill-handle` overrides it without a class.
 *
 * It is deliberately NOT in the tab order: the grid is one tab stop, and a
 * focusable square inside it would break that promise. The keyboard route to
 * the same behaviour is Ctrl/Cmd+D, which announces what it wrote.
 */
import type { CSSProperties, ReactElement } from "react";

import { sameGridCell } from "./gridFocus";
import type { GridFocusState } from "./useGridFocus";

/** Props for {@link FillHandle}. */
export interface FillHandleProps {
  /** The grid focus state, straight from `table.gridFocus`. */
  focus: GridFocusState | undefined;
  /** The cell's index in the RENDERED window — what an adapter already has. */
  windowIndex: number;
  /** The cell's column index. */
  col: number;
  /** Where the rendered window starts in the dataset. Zero unless paged. */
  firstRowIndex?: number;
  /** A kit's own class for the square, if it wants one. */
  className?: string;
}

/**
 * A zero-height anchor at the end of the cell's content: it takes no space in
 * the layout, so no kit's padding or line height shifts, and it gives the
 * square a coordinate space that does not depend on the cell being positioned.
 */
const ANCHOR: CSSProperties = {
  position: "relative",
  display: "block",
  height: 0,
};

/** The square itself, on the cell's bottom inline-end corner. */
const SQUARE: CSSProperties = {
  position: "absolute",
  insetInlineEnd: -3,
  bottom: -3,
  width: 8,
  height: 8,
  borderRadius: 1,
  background: "var(--adapttable-fill-handle, currentColor)",
  cursor: "crosshair",
};

/**
 * Renders the fill handle when this cell is the selection's corner, and
 * nothing at all otherwise — so an adapter renders it unconditionally in every
 * cell and the opt-in promise still holds.
 */
export function FillHandle({
  focus,
  windowIndex,
  col,
  firstRowIndex = 0,
  className,
}: Readonly<FillHandleProps>): ReactElement | null {
  const corner = focus?.fillHandleCell;
  if (!corner || !focus) return null;
  if (!sameGridCell(corner, { row: firstRowIndex + windowIndex, col })) {
    return null;
  }
  return (
    <span style={ANCHOR} data-adapttable-part="fill-handle-anchor">
      <span
        {...focus.getFillHandleProps()}
        data-adapttable-part="fill-handle"
        aria-hidden="true"
        title={focus.fillHandleLabel}
        className={className}
        style={SQUARE}
      />
    </span>
  );
}
