import {
  type ColumnDef,
  type Direction,
  groupAggregateEntries,
  type GroupedFlatEntry,
  groupRowLayout,
  groupSelectionState,
  type SelectionState,
  type TableLabels,
} from "@adapttable/core";
import {
  ExpandChevron,
  groupIndentStyle,
  resolveMobileLabel,
} from "@adapttable/core/adapter";
import type { ReactElement } from "react";

import type { BaseUiAccentColor } from "../types";
import { Box, Card, Flex, IconButton, Table, Text } from "../ui";
import { Checkbox } from "./primitives";

/** Chevron toggle for a row-group's collapse state (mirrors {@link ExpandToggle}). */
function GroupExpandToggle({
  open,
  dir,
  labels,
  onToggle,
}: Readonly<{
  open: boolean;
  dir?: Direction;
  labels: Pick<Required<TableLabels>, "expandGroup" | "collapseGroup">;
  onToggle: () => void;
}>) {
  return (
    <IconButton
      size="1"
      variant="ghost"
      color="gray"
      data-adapttable-part="group-toggle"
      aria-expanded={open}
      aria-label={open ? labels.collapseGroup : labels.expandGroup}
      onClick={onToggle}
    >
      <ExpandChevron open={open} dir={dir} />
    </IconButton>
  );
}

/** Kit-native (Base UI) group header row for the desktop table. */
export function GroupHeaderRow<TRow>({
  entry,
  columns,
  leadingCells,
  showActions,
  getCellProps,
  selection,
  labels,
  dir,
  accentColor,
  onToggleCollapse,
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" }>;
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
  dir?: Direction;
  accentColor?: BaseUiAccentColor;
  onToggleCollapse: (groupKey: string) => void;
}>): ReactElement {
  const expanded = !entry.collapsed;
  const groupState = selection
    ? groupSelectionState(entry.leafIds, selection.selectedIds)
    : "none";
  // One cell per column from the first aggregate onward: a subtotal only reads
  // as one when it sits under the column it totals.
  const layout = groupRowLayout(columns, entry.aggregateCells);

  return (
    <Table.Row
      data-adapttable-part="group-row"
      data-collapsed={entry.collapsed ? "true" : undefined}
      style={{ fontWeight: 600 }}
    >
      <Table.Cell
        colSpan={leadingCells + layout.labelColumns.length}
        data-adapttable-part="group-cell"
        style={groupIndentStyle(entry.level)}
      >
        <Flex gap="2" align="center" style={{ width: "100%" }}>
          <GroupExpandToggle
            open={expanded}
            dir={dir}
            labels={labels}
            onToggle={() => onToggleCollapse(entry.key)}
          />
          {selection && (
            <Box data-adapttable-part="group-select">
              <Checkbox
                aria-label={labels.selectAll}
                checked={groupState === "all"}
                indeterminate={groupState === "some"}
                color={accentColor}
                onToggle={() => selection.toggleGroupLeaves(entry.leafIds)}
              />
            </Box>
          )}
          <Text as="span" data-adapttable-part="group-label">
            {entry.label}
          </Text>
          <Text
            as="span"
            data-adapttable-part="group-count"
            color="gray"
            size="2"
          >
            {labels.groupCount(entry.leafIds.length)}
          </Text>
          {layout.labelAggregates.map(({ column, node }) => (
            <Box
              key={column.key}
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              style={{ marginInlineStart: "auto" }}
            >
              {node}
            </Box>
          ))}
        </Flex>
      </Table.Cell>
      {layout.cells.map(({ column, node }) => (
        <Table.Cell
          key={column.key}
          {...getCellProps(column)}
          data-adapttable-part={
            node === undefined ? undefined : "group-aggregate"
          }
          data-column={node === undefined ? undefined : column.key}
        >
          {node}
        </Table.Cell>
      ))}
      {showActions && <Table.Cell />}
    </Table.Row>
  );
}

/** Group header block for the mobile card list. */
export function GroupHeaderCard<TRow>({
  entry,
  columns,
  selection,
  labels,
  dir,
  accentColor,
  onToggleCollapse,
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" }>;
  /** The card's columns, for captioning each subtotal. */
  columns: readonly ColumnDef<TRow>[];
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  dir?: Direction;
  accentColor?: BaseUiAccentColor;
  onToggleCollapse: (groupKey: string) => void;
}>): ReactElement {
  const expanded = !entry.collapsed;
  const groupState = selection
    ? groupSelectionState(entry.leafIds, selection.selectedIds)
    : "none";

  return (
    <Card
      data-adapttable-part="group-card"
      data-collapsed={entry.collapsed ? "true" : undefined}
      style={{ fontWeight: 600 }}
    >
      <Flex gap="2" align="center">
        <GroupExpandToggle
          open={expanded}
          dir={dir}
          labels={labels}
          onToggle={() => onToggleCollapse(entry.key)}
        />
        {selection && (
          <Box data-adapttable-part="group-select">
            <Checkbox
              aria-label={labels.selectAll}
              checked={groupState === "all"}
              indeterminate={groupState === "some"}
              color={accentColor}
              onToggle={() => selection.toggleGroupLeaves(entry.leafIds)}
            />
          </Box>
        )}
        <Text as="span" data-adapttable-part="group-label">
          {entry.label}
        </Text>
        <Text
          as="span"
          data-adapttable-part="group-count"
          color="gray"
          size="2"
        >
          {labels.groupCount(entry.leafIds.length)}
        </Text>
      </Flex>
      {groupAggregateEntries(columns, entry.aggregateCells).map(
        ({ column, node }) => (
          <Flex key={column.key} gap="2">
            <Text as="span" color="gray" size="2">
              {resolveMobileLabel(column)}
            </Text>
            <Text
              as="span"
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              style={{ marginInlineStart: "auto" }}
            >
              {node}
            </Text>
          </Flex>
        )
      )}
    </Card>
  );
}
