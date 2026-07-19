import {
  type GroupedFlatEntry,
  groupSelectionState,
  type SelectionState,
  type TableLabels,
} from "@adapttable/core";
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
  columnSpan,
  selection,
  labels,
  onToggleCollapse,
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" }>;
  columnSpan: number;
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  onToggleCollapse: (groupKey: string) => void;
}>): ReactElement {
  const expanded = !entry.collapsed;
  const groupState = selection
    ? groupSelectionState(entry.leafIds, selection.selectedIds)
    : "none";

  return (
    <TableRow
      data-adapttable-part="group-row"
      data-collapsed={entry.collapsed ? "true" : undefined}
    >
      <TableCell colSpan={columnSpan} sx={{ fontWeight: 600 }}>
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
          {entry.aggregateCells &&
            Object.entries(entry.aggregateCells).map(([key, node]) => (
              <Box
                key={key}
                component="span"
                data-adapttable-part="group-aggregate"
                data-column={key}
                sx={{ marginInlineStart: "auto" }}
              >
                {node}
              </Box>
            ))}
        </Box>
      </TableCell>
    </TableRow>
  );
}

/** Group header block for the mobile card list. */
export function GroupHeaderCard<TRow>({
  entry,
  selection,
  labels,
  onToggleCollapse,
  compact = false,
}: Readonly<{
  entry: Extract<GroupedFlatEntry<TRow>, { kind: "group" }>;
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
      </CardContent>
    </Card>
  );
}
