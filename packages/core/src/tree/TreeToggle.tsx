/**
 * The chevron in front of a tree row, and the space where one would be.
 *
 * It lives in core because a tree is one shape rendered eight times: the same
 * indent step, the same accessible name, the same `aria-expanded`, and — the
 * part that is easy to get wrong — the same footprint on a LEAF, so a folder's
 * children line up under its name rather than under its chevron.
 */
import type { ReactElement } from "react";

import type { TableLabels } from "../types";
import type { TreeEntry } from "./treeRows";

/** Props for {@link TreeToggle}. */
export interface TreeToggleProps<TRow> {
  /** The row's place in the tree. */
  entry: TreeEntry<TRow>;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** Open or close this node. */
  onToggle: (id: string) => void;
  /** Class for the chevron — the unstyled kit's `treeToggle` hook. */
  toggleClassName?: string;
  /** Class for a leaf's placeholder — the unstyled kit's `treeSpacer` hook. */
  spacerClassName?: string;
}

const BUTTON = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.5em",
  height: "1.5em",
  flexShrink: 0,
  padding: 0,
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
} as const;

/**
 * Renders the chevron for a row with children, or an equal-width spacer for a
 * leaf so the column stays aligned.
 */
export function TreeToggle<TRow>({
  entry,
  labels,
  onToggle,
  toggleClassName,
  spacerClassName,
}: Readonly<TreeToggleProps<TRow>>): ReactElement {
  if (!entry.hasChildren) {
    return (
      <span
        aria-hidden="true"
        data-adapttable-part="tree-spacer"
        className={spacerClassName}
        style={{ display: "inline-block", width: "1.5em", flexShrink: 0 }}
      />
    );
  }
  return (
    <button
      type="button"
      data-adapttable-part="tree-toggle"
      className={toggleClassName}
      aria-expanded={entry.expanded}
      aria-label={
        entry.expanded
          ? (labels?.collapseRow ?? "Collapse row")
          : (labels?.expandRow ?? "Expand row")
      }
      data-loading={entry.loading === true ? "" : undefined}
      onClick={() => {
        onToggle(entry.key);
      }}
      style={BUTTON}
    >
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          // The same glyph either way, turned — one shape, one animation, and
          // nothing to keep in step between the two states.
          transform: entry.expanded ? "rotate(90deg)" : "none",
          transition: "transform 150ms ease",
        }}
      >
        ▸
      </span>
    </button>
  );
}
