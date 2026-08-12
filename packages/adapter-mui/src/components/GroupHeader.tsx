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
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  IconButton,
  TableCell,
  TableRow,
  Typography,
} from "@mui/material";
import type { ReactElement } from "react";

function GroupChevron({ expanded }: Readonly<{ expanded: boolean }>) {
  return (
    <Box
      component="span"
      aria-hidden
      sx={{
        display: "inline-flex",
        transition: "transform 150ms",
        transform: expanded ? "rotate(90deg)" : undefined,
      }}
    >
      <svg
        width="1em"
        height="1em"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M9 6l6 6-6 6" />
      </svg>
    </Box>
  );
}

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
    <IconButton
      size="small"
      data-adapttable-part="group-toggle"
      aria-expanded={expanded}
      aria-label={expanded ? collapseLabel : expandLabel}
      onClick={onToggle}
    >
      <GroupChevron expanded={expanded} />
    </IconButton>
  );
}

/** MUI group header row for the desktop table. */
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
    <TableRow
      data-adapttable-part="group-row"
      data-collapsed={entry.collapsed ? "true" : undefined}
    >
      <TableCell
        colSpan={leadingCells + layout.labelColumns.length}
        sx={{ fontWeight: 600 }}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            width: "100%",
          }}
        >
          <GroupToggle
            expanded={expanded}
            expandLabel={labels.expandGroup}
            collapseLabel={labels.collapseGroup}
            onToggle={() => onToggleCollapse(entry.key)}
          />
          {selection && (
            <Checkbox
              data-adapttable-part="group-select"
              slotProps={{ input: { "aria-label": labels.selectAll } }}
              checked={groupState === "all"}
              indeterminate={groupState === "some"}
              onChange={() => selection.toggleGroupLeaves(entry.leafIds)}
            />
          )}
          <Typography
            component="span"
            data-adapttable-part="group-label"
            variant="body2"
            sx={{ fontWeight: 600 }}
          >
            {entry.label}
          </Typography>
          <Typography
            component="span"
            data-adapttable-part="group-count"
            variant="body2"
            color="text.secondary"
          >
            {labels.groupCount(entry.leafIds.length)}
          </Typography>
          {layout.labelAggregates.map(({ column, node }) => (
            <Box
              key={column.key}
              component="span"
              data-adapttable-part="group-aggregate"
              data-column={column.key}
              sx={{ marginInlineStart: "auto" }}
            >
              {node}
            </Box>
          ))}
        </Box>
      </TableCell>
      {layout.cells.map(({ column, node }) => (
        <TableCell
          key={column.key}
          {...getCellProps(column)}
          data-adapttable-part={
            node === undefined ? undefined : "group-aggregate"
          }
          data-column={node === undefined ? undefined : column.key}
        >
          {node}
        </TableCell>
      ))}
      {showActions && <TableCell />}
    </TableRow>
  );
}

/** Group header block for the mobile card list. */
export function GroupHeaderCard<TRow>({
  entry,
  columns,
  selection,
  labels,
  onToggleCollapse,
  compact = false,
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" }>;
  /** The card's columns, for captioning each subtotal. */
  columns: readonly ColumnDef<TRow>[];
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  onToggleCollapse: (groupKey: string) => void;
  compact?: boolean;
}>): ReactElement {
  const expanded = !entry.collapsed;
  const groupState = selection
    ? groupSelectionState(entry.leafIds, selection.selectedIds)
    : "none";

  return (
    <Card
      data-adapttable-part="group-card"
      data-collapsed={entry.collapsed ? "true" : undefined}
      variant="outlined"
    >
      <CardContent
        sx={compact ? { p: 1.25, "&:last-child": { pb: 1.25 } } : undefined}
      >
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            fontWeight: 600,
          }}
        >
          <GroupToggle
            expanded={expanded}
            expandLabel={labels.expandGroup}
            collapseLabel={labels.collapseGroup}
            onToggle={() => onToggleCollapse(entry.key)}
          />
          {selection && (
            <Checkbox
              data-adapttable-part="group-select"
              slotProps={{ input: { "aria-label": labels.selectAll } }}
              checked={groupState === "all"}
              indeterminate={groupState === "some"}
              onChange={() => selection.toggleGroupLeaves(entry.leafIds)}
            />
          )}
          <Typography
            component="span"
            data-adapttable-part="group-label"
            variant="body2"
            sx={{ fontWeight: 600 }}
          >
            {entry.label}
          </Typography>
          <Typography
            component="span"
            data-adapttable-part="group-count"
            variant="body2"
            color="text.secondary"
          >
            {labels.groupCount(entry.leafIds.length)}
          </Typography>
        </Box>
        {groupAggregateEntries(columns, entry.aggregateCells).map(
          ({ column, node }) => (
            <Box key={column.key} sx={{ display: "flex", gap: 1, mt: 0.5 }}>
              <Typography
                component="span"
                variant="body2"
                color="text.secondary"
              >
                {resolveMobileLabel(column)}
              </Typography>
              <Typography
                component="span"
                data-adapttable-part="group-aggregate"
                data-column={column.key}
                variant="body2"
                sx={{ marginInlineStart: "auto" }}
              >
                {node}
              </Typography>
            </Box>
          )
        )}
      </CardContent>
    </Card>
  );
}
