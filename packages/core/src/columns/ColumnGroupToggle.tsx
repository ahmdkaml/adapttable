import type { ReactElement } from "react";

import type { TableLabels } from "../types";
import type { HeaderGroupCell } from "./headerGroups";

/** Props for {@link ColumnGroupToggle}. */
export interface ColumnGroupToggleProps {
  cell: HeaderGroupCell;
  labels: Required<TableLabels>;
  onToggle: (id: string) => void;
  className?: string;
}

const BUTTON = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  width: "1.5em",
  height: "1.5em",
  flexShrink: 0,
  padding: 0,
  marginInlineEnd: "0.25em",
  border: "none",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
} as const;

/** Collapse/expand control for one column-group header cell. */
export function ColumnGroupToggle({
  cell,
  labels,
  onToggle,
  className,
}: Readonly<ColumnGroupToggleProps>): ReactElement {
  const id = cell.id;
  if (!cell.collapsible || id === null) return <></>;
  return (
    <button
      type="button"
      data-adapttable-part="column-group-toggle"
      aria-expanded={!cell.collapsed}
      aria-label={
        cell.collapsed ? labels.expandColumnGroup : labels.collapseColumnGroup
      }
      className={className}
      style={BUTTON}
      onClick={() => onToggle(id)}
    >
      {cell.collapsed ? "▶" : "▼"}
    </button>
  );
}
