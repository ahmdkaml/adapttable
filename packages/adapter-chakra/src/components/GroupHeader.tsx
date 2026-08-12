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
import { Box, Card, HStack, IconButton, Table, Text } from "@chakra-ui/react";
import type { ReactElement } from "react";

import { subtleText } from "../styles";
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
      size="xs"
      variant="ghost"
      data-adapttable-part="group-toggle"
      aria-expanded={open}
      aria-label={open ? labels.collapseGroup : labels.expandGroup}
      onClick={onToggle}
    >
      <ExpandChevron open={open} dir={dir} />
    </IconButton>
  );
}

/** Kit-native (Chakra) group header row for the desktop table. */
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
  accentColor?: string;
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
      fontWeight="semibold"
    >
      <Table.Cell
        colSpan={leadingCells + layout.labelColumns.length}
        data-adapttable-part="group-cell"
        style={groupIndentStyle(entry.level)}
      >
        <HStack gap={2} w="full">
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
                colorPalette={accentColor}
                onToggle={() => selection.toggleGroupLeaves(entry.leafIds)}
              />
            </Box>
          )}
          <Text as="span" data-adapttable-part="group-label">
            {entry.label}
          </Text>
          <Text as="span" data-adapttable-part="group-count" {...subtleText}>
            {labels.groupCount(entry.leafIds.length)}
          </Text>
          {layout.labelAggregates.map(({ column, node }) => (
            <Box
              key={column.key}
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              ms="auto"
            >
              {node}
            </Box>
          ))}
        </HStack>
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
  accentColor?: string;
  onToggleCollapse: (groupKey: string) => void;
}>): ReactElement {
  const expanded = !entry.collapsed;
  const groupState = selection
    ? groupSelectionState(entry.leafIds, selection.selectedIds)
    : "none";

  return (
    <Card.Root
      data-adapttable-part="group-card"
      data-collapsed={entry.collapsed ? "true" : undefined}
      variant="outline"
      fontWeight="semibold"
    >
      <Card.Body>
        <HStack gap={2}>
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
                colorPalette={accentColor}
                onToggle={() => selection.toggleGroupLeaves(entry.leafIds)}
              />
            </Box>
          )}
          <Text as="span" data-adapttable-part="group-label">
            {entry.label}
          </Text>
          <Text as="span" data-adapttable-part="group-count" {...subtleText}>
            {labels.groupCount(entry.leafIds.length)}
          </Text>
        </HStack>
        {groupAggregateEntries(columns, entry.aggregateCells).map(
          ({ column, node }) => (
            <HStack key={column.key} gap="2" mt="1">
              <Text as="span" {...subtleText}>
                {resolveMobileLabel(column)}
              </Text>
              <Text
                as="span"
                data-adapttable-part="group-aggregate"
                data-column={column.key}
                ms="auto"
              >
                {node}
              </Text>
            </HStack>
          )
        )}
      </Card.Body>
    </Card.Root>
  );
}
