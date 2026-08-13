/**
 * The button that reveals the next page of groups, or of a group's rows.
 *
 * It lives in core because it is the same sentence in every kit — "Show 42
 * more groups" — wired to the same action, and eight copies of a button is
 * eight places for the wording and the part name to drift.
 */
import type { ReactElement } from "react";

import type { TableLabels } from "../types";

/** Props for {@link GroupMoreButton}. */
export interface GroupMoreButtonProps {
  /** Whether this offers more groups or more rows inside one. */
  scope: "groups" | "rows";
  /** How many are still hidden. */
  remaining: number;
  /** The group whose rows are being revealed, for a `"rows"` offer. */
  groupKey?: string;
  /** Labels; falls back to the built-in English. */
  labels: Required<TableLabels>;
  /** Reveal the next page. */
  onShowMore: (entry: { scope: "groups" | "rows"; groupKey?: string }) => void;
}

/** Renders the offer as a plain button that inherits the kit's type. */
export function GroupMoreButton({
  scope,
  remaining,
  groupKey,
  labels,
  onShowMore,
}: Readonly<GroupMoreButtonProps>): ReactElement {
  return (
    <button
      type="button"
      data-adapttable-part="group-more"
      onClick={() => {
        onShowMore({ scope, groupKey });
      }}
      style={{
        font: "inherit",
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        textDecoration: "underline",
        color: "inherit",
      }}
    >
      {scope === "groups"
        ? labels.moreGroups(remaining)
        : labels.moreRowsInGroup(remaining)}
    </button>
  );
}
