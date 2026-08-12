import {
  type ColumnDef,
  groupAggregateEntries,
  type GroupedFlatEntry,
  groupRowLayout,
  groupSelectionState,
  type SelectionState,
  type TableLabels,
} from "@adapttable/core";
import { resolveMobileLabel } from "@adapttable/core/adapter";
import { ActionIcon, Card, Checkbox, Group, Table, Text } from "@mantine/core";
import type { ReactElement } from "react";

import { ChevronRightIcon } from "../icons";

function GroupToggle({
  expanded,
  expandLabel,
  collapseLabel,
  onToggle,
}: Readonly<{
  expanded: boolean;
  expandLabel: string;
  collapseLabel: string;
  onToggle: () => void;
}>) {
  return (
    <ActionIcon
      variant="subtle"
      color="gray"
      size="sm"
      data-adapttable-part="group-toggle"
      aria-expanded={expanded}
      aria-label={expanded ? collapseLabel : expandLabel}
      onClick={onToggle}
    >
      <ChevronRightIcon
        size={14}
        style={{
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)",
          transition: "transform 150ms ease",
        }}
      />
    </ActionIcon>
  );
}

/** Mantine group header row for the desktop table. */
export function GroupHeaderRow<TRow>({
  entry,
  columns,
  leadingCells,
  showActions,
  getCellProps,
  selection,
  labels,
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
    <Table.Tr
      data-adapttable-part="group-row"
      data-collapsed={entry.collapsed ? "true" : undefined}
      fw={600}
    >
      <Table.Td colSpan={leadingCells + layout.labelColumns.length}>
        <Group gap="xs" wrap="nowrap">
          <GroupToggle
            expanded={expanded}
            expandLabel={labels.expandGroup}
            collapseLabel={labels.collapseGroup}
            onToggle={() => onToggleCollapse(entry.key)}
          />
          {selection && (
            <Checkbox
              data-adapttable-part="group-select"
              aria-label={labels.selectAll}
              checked={groupState === "all"}
              indeterminate={groupState === "some"}
              onChange={() => selection.toggleGroupLeaves(entry.leafIds)}
            />
          )}
          <Text component="span" data-adapttable-part="group-label" fw={600}>
            {entry.label}
          </Text>
          <Text
            component="span"
            data-adapttable-part="group-count"
            c="dimmed"
            fz="sm"
          >
            {labels.groupCount(entry.leafIds.length)}
          </Text>
          {layout.labelAggregates.map(({ column, node }) => (
            <Text
              key={column.key}
              component="span"
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              ms="auto"
            >
              {node}
            </Text>
          ))}
        </Group>
      </Table.Td>
      {layout.cells.map(({ column, node }) => (
        <Table.Td
          key={column.key}
          {...getCellProps(column)}
          data-adapttable-part={
            node === undefined ? undefined : "group-aggregate"
          }
          data-column={node === undefined ? undefined : column.key}
        >
          {node}
        </Table.Td>
      ))}
      {showActions && <Table.Td />}
    </Table.Tr>
  );
}

/** Group header block for the mobile card list. */
export function GroupHeaderCard<TRow>({
  entry,
  columns,
  selection,
  labels,
  onToggleCollapse,
  padding = "md",
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" }>;
  /** The card's columns, for captioning each subtotal. */
  columns: readonly ColumnDef<TRow>[];
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  onToggleCollapse: (groupKey: string) => void;
  padding?: string;
}>): ReactElement {
  const expanded = !entry.collapsed;
  const groupState = selection
    ? groupSelectionState(entry.leafIds, selection.selectedIds)
    : "none";

  return (
    <Card
      data-adapttable-part="group-card"
      data-collapsed={entry.collapsed ? "true" : undefined}
      role="listitem"
      withBorder
      radius="md"
      padding={padding}
      fw={600}
    >
      <Group gap="xs" wrap="nowrap">
        <GroupToggle
          expanded={expanded}
          expandLabel={labels.expandGroup}
          collapseLabel={labels.collapseGroup}
          onToggle={() => onToggleCollapse(entry.key)}
        />
        {selection && (
          <Checkbox
            data-adapttable-part="group-select"
            aria-label={labels.selectAll}
            checked={groupState === "all"}
            indeterminate={groupState === "some"}
            onChange={() => selection.toggleGroupLeaves(entry.leafIds)}
          />
        )}
        <Text component="span" data-adapttable-part="group-label" fw={600}>
          {entry.label}
        </Text>
        <Text
          component="span"
          data-adapttable-part="group-count"
          c="dimmed"
          fz="sm"
        >
          {labels.groupCount(entry.leafIds.length)}
        </Text>
      </Group>
      {/* A card is a list of label/value pairs, not a row of columns, so a
          subtotal is captioned rather than aligned — the same resolver the data
          cards use, so the caption reads identically. */}
      {groupAggregateEntries(columns, entry.aggregateCells).map(
        ({ column, node }) => (
          <Group key={column.key} gap="xs" wrap="nowrap" mt="xs">
            <Text component="span" c="dimmed" fz="sm">
              {resolveMobileLabel(column)}
            </Text>
            <Text
              component="span"
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              ms="auto"
            >
              {node}
            </Text>
          </Group>
        )
      )}
    </Card>
  );
}
