/**
 * The tree column's cell: the chevron, the indent, and the cell's own content
 * on one line.
 *
 * The indent belongs to the whole cell, not to the chevron. Indenting only the
 * disclosure control leaves every name at the same margin, so a hierarchy reads
 * as a flat list with chevrons scattered through it — this wraps the content so
 * the name moves with its depth.
 *
 * Any column that is not the tree column renders its children untouched, which
 * is what lets an adapter wrap its existing cell in one place rather than
 * duplicating it behind a condition.
 */
import type { ReactElement, ReactNode } from "react";

import type { TableLabels } from "../types";
import type { TreeEntry } from "./treeRows";
import { treeIndentStyle } from "./treeRows";
import { TreeToggle } from "./TreeToggle";

/** Props for {@link TreeCell}. */
export interface TreeCellProps<TRow> {
  /** The row's place in the tree; absent on a flat table. */
  entry: TreeEntry<TRow> | undefined;
  /** This cell's column. */
  columnKey: string;
  /** The column that carries the chevron. */
  treeColumnKey: string | undefined;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** Open or close this node. */
  onToggle?: (id: string) => void;
  /** Class for the wrapper — the unstyled kit's `treeCell` hook. */
  className?: string;
  /** Class for the chevron. */
  toggleClassName?: string;
  /** Class for a leaf's placeholder. */
  spacerClassName?: string;
  /** The cell's own content. */
  children: ReactNode;
}

const WRAPPER = {
  display: "inline-flex",
  alignItems: "center",
  gap: 4,
} as const;

/**
 * Wrap a cell in its tree chrome when it is the tree column, and pass it
 * through unchanged when it is not.
 */
export function TreeCell<TRow>({
  entry,
  columnKey,
  treeColumnKey,
  labels,
  onToggle,
  className,
  toggleClassName,
  spacerClassName,
  children,
}: Readonly<TreeCellProps<TRow>>): ReactElement {
  if (!entry || columnKey !== treeColumnKey) return <>{children}</>;
  return (
    <span
      data-adapttable-part="tree-cell"
      className={className}
      style={{ ...WRAPPER, ...treeIndentStyle(entry.level) }}
    >
      <TreeToggle
        entry={entry}
        labels={labels}
        onToggle={onToggle ?? (() => undefined)}
        toggleClassName={toggleClassName}
        spacerClassName={spacerClassName}
      />
      {children}
    </span>
  );
}
