/**
 * The live region that says where keyboard focus went.
 *
 * A cell gaining DOM focus is announced by the screen reader on its own, but
 * only as the cell's contents — not which column it belongs to, and not where
 * it sits in a dataset the user cannot see the end of. "1,240" is useless;
 * "Budget, 1,240, row 40,002 of 100,000" is navigation.
 *
 * It lives in core rather than in eight adapters because the details are easy
 * to get subtly wrong and invisible when they are: `aria-live="polite"` so it
 * waits for a gap rather than interrupting, `aria-atomic` so the whole phrase
 * is read rather than the diff, and visually hidden by clip rather than
 * `display: none` — a hidden element is not announced at all, which is the
 * classic way this feature ships broken.
 */
import type { ReactElement } from "react";

import type { GridFocusState } from "./useGridFocus";

/** Props for {@link GridFocusAnnouncer}. */
export interface GridFocusAnnouncerProps {
  /** The grid focus state, straight from `table.gridFocus`. */
  focus: GridFocusState;
}

/**
 * Clipped rather than hidden: a screen reader ignores `display: none` and
 * `visibility: hidden`, so the region has to remain in the layout while taking
 * no visible space.
 */
const VISUALLY_HIDDEN = {
  position: "absolute",
  width: "1px",
  height: "1px",
  margin: "-1px",
  padding: 0,
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  whiteSpace: "nowrap",
  border: 0,
} as const;

/**
 * Renders the grid's focus announcements, or nothing at all when cell
 * navigation is off — so an adapter spreads it unconditionally and the opt-in
 * promise still holds. When on, the region is present from the first render and
 * empty until focus moves, which is the order screen readers need.
 */
export function GridFocusAnnouncer({
  focus,
}: Readonly<GridFocusAnnouncerProps>): ReactElement | null {
  if (!focus.enabled) return null;
  return (
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      data-adapttable-part="grid-announcer"
      style={VISUALLY_HIDDEN}
    >
      {focus.announcement}
    </div>
  );
}
