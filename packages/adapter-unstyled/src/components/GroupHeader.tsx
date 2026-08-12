import {
  type ColumnDef,
  groupAggregateEntries,
  type GroupedFlatEntry,
  groupRowLayout,
  groupSelectionState,
  type SelectionState,
  type TableLabels,
} from "@adapttable/core";
import { groupIndentStyle, resolveMobileLabel } from "@adapttable/core/adapter";
import type { ReactElement } from "react";

import type { DataTableClassNames } from "../types";
import { ChevronIcon } from "./icons";

/** Kit-native (unstyled) group header row for the desktop table. */
export function GroupHeaderRow<TRow>({
  entry,
  columns,
  leadingCells,
  showActions,
  getCellProps,
  selection,
  labels,
  classNames,
  onToggleCollapse,
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" | "groupFooter" }>;
  /** The data columns as rendered, so a subtotal lands under its own. */
  columns: readonly ColumnDef<TRow>[];
  /** Edge cells before the first data column (chevron, checkbox). */
  leadingCells: number;
  /** Whether a trailing actions column needs an empty cell. */
  showActions: boolean;
  /** The table's per-column cell props, so a number inherits its alignment. */
  getCellProps: (column: ColumnDef<TRow>) => Record<string, unknown>;
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  classNames: DataTableClassNames;
  onToggleCollapse: (groupKey: string) => void;
}>): ReactElement {
  // A footer is the same row with the controls taken away: no chevron (there
  // is nothing to collapse from the bottom), no checkbox (the header's already
  // selects the group), and a caption that says what the numbers are.
  const footer = entry.kind === "groupFooter";
  const expanded = footer || !entry.collapsed;
  const groupState =
    selection && !footer
      ? groupSelectionState(entry.leafIds, selection.selectedIds)
      : "none";
  // One cell per column from the first aggregate onward: a subtotal only reads
  // as one when it sits under the column it totals.
  const layout = groupRowLayout(columns, entry.aggregateCells);

  return (
    <tr
      data-adapttable-part={footer ? "group-footer-row" : "group-row"}
      data-collapsed={!footer && entry.collapsed ? "true" : undefined}
      className={footer ? classNames.groupFooterRow : classNames.groupRow}
    >
      <td
        colSpan={leadingCells + layout.labelColumns.length}
        data-adapttable-part={footer ? "group-footer-cell" : "group-cell"}
        className={footer ? classNames.groupFooterCell : classNames.groupCell}
        style={{ fontWeight: 600, ...groupIndentStyle(entry.level) }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
          }}
        >
          {!footer && (
            <button
              type="button"
              data-adapttable-part="group-toggle"
              aria-expanded={expanded}
              aria-label={expanded ? labels.collapseGroup : labels.expandGroup}
              className={classNames.groupToggle}
              onClick={() => onToggleCollapse(entry.key)}
            >
              <span
                style={{
                  display: "inline-flex",
                  transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                  transition: "transform 150ms ease",
                }}
              >
                <ChevronIcon size={14} />
              </span>
            </button>
          )}
          {selection && !footer && (
            <input
              type="checkbox"
              data-adapttable-part="group-select"
              className={classNames.groupSelect}
              aria-label={labels.selectAll}
              checked={groupState === "all"}
              ref={(node) => {
                if (node) node.indeterminate = groupState === "some";
              }}
              onChange={() => selection.toggleGroupLeaves(entry.leafIds)}
            />
          )}
          <span
            data-adapttable-part="group-label"
            className={classNames.groupLabel}
          >
            {footer ? labels.groupTotal(entry.label) : entry.label}
          </span>
          {!footer && (
            <span
              data-adapttable-part="group-count"
              className={classNames.groupCount}
              style={{ opacity: 0.65 }}
            >
              {labels.groupCount(entry.leafIds.length)}
            </span>
          )}
          {layout.labelAggregates.map(({ column, node }) => (
            <span
              key={column.key}
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              className={classNames.groupAggregate}
              style={{ marginInlineStart: "auto" }}
            >
              {node}
            </span>
          ))}
        </span>
      </td>
      {layout.cells.map(({ column, node }) => (
        <td
          key={column.key}
          {...getCellProps(column)}
          data-adapttable-part={
            node === undefined ? undefined : "group-aggregate"
          }
          data-column={node === undefined ? undefined : column.key}
          className={classNames.groupAggregate}
        >
          {node}
        </td>
      ))}
      {showActions && <td />}
    </tr>
  );
}

/** Group header block for the mobile card list. */
export function GroupHeaderCard<TRow>({
  entry,
  columns,
  selection,
  labels,
  classNames,
  onToggleCollapse,
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" | "groupFooter" }>;
  /** The card's columns, for captioning each subtotal. */
  columns: readonly ColumnDef<TRow>[];
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  classNames: DataTableClassNames;
  onToggleCollapse: (groupKey: string) => void;
}>): ReactElement {
  // A footer is the same row with the controls taken away: no chevron (there
  // is nothing to collapse from the bottom), no checkbox (the header's already
  // selects the group), and a caption that says what the numbers are.
  const footer = entry.kind === "groupFooter";
  const expanded = footer || !entry.collapsed;
  const groupState =
    selection && !footer
      ? groupSelectionState(entry.leafIds, selection.selectedIds)
      : "none";

  return (
    <div
      data-adapttable-part={footer ? "group-footer-card" : "group-card"}
      data-collapsed={!footer && entry.collapsed ? "true" : undefined}
      className={classNames.groupCard}
      style={{ fontWeight: 600 }}
    >
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {!footer && (
          <button
            type="button"
            data-adapttable-part="group-toggle"
            aria-expanded={expanded}
            aria-label={expanded ? labels.collapseGroup : labels.expandGroup}
            className={classNames.groupToggle}
            onClick={() => onToggleCollapse(entry.key)}
          >
            <span
              style={{
                display: "inline-flex",
                transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
                transition: "transform 150ms ease",
              }}
            >
              <ChevronIcon size={14} />
            </span>
          </button>
        )}
        {selection && !footer && (
          <input
            type="checkbox"
            data-adapttable-part="group-select"
            className={classNames.groupSelect}
            aria-label={labels.selectAll}
            checked={groupState === "all"}
            ref={(node) => {
              if (node) node.indeterminate = groupState === "some";
            }}
            onChange={() => selection.toggleGroupLeaves(entry.leafIds)}
          />
        )}
        <span
          data-adapttable-part="group-label"
          className={classNames.groupLabel}
        >
          {footer ? labels.groupTotal(entry.label) : entry.label}
        </span>
        {!footer && (
          <span
            data-adapttable-part="group-count"
            className={classNames.groupCount}
            style={{ opacity: 0.65 }}
          >
            {labels.groupCount(entry.leafIds.length)}
          </span>
        )}
      </span>
      {groupAggregateEntries(columns, entry.aggregateCells).map(
        ({ column, node }) => (
          <span
            key={column.key}
            style={{ display: "flex", gap: 8, marginTop: 4 }}
          >
            <span className={classNames.groupCount} style={{ opacity: 0.65 }}>
              {resolveMobileLabel(column)}
            </span>
            <span
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              className={classNames.groupAggregate}
              style={{ marginInlineStart: "auto" }}
            >
              {node}
            </span>
          </span>
        )
      )}
    </div>
  );
}
