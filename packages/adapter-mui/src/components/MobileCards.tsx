/** The card list rendered in place of the table on narrow screens. */
import {
  bodyRowEntries,
  type ColumnDef,
  type ConfirmHandler,
  type EditableCellEditing,
  type RowAction,
  type TableLabels,
  treeCardStyle,
  type TreeEntry,
} from "@adapttable/core";
import {
  resolveMobileLabel,
  resolveVirtualRows,
  rowClickProps,
  rowEditingSignature,
  rowIsDirty,
  TreeToggle,
  useSummaryCells,
} from "@adapttable/core/adapter";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  Stack,
  Typography,
} from "@mui/material";
import type { ReactElement, ReactNode } from "react";
import { memo, useMemo } from "react";

import { type SharedProps } from "./DesktopTable";
import { EditableDataCell } from "./EditableCell";
import { ExpandToggle } from "./ExpandToggle";
import { GroupHeaderCard } from "./GroupHeader";
import { RowActionButtons } from "./RowActionButtons";

/** Per-card inputs for the memoized {@link MobileCardBase}. */
interface MobileCardProps<TRow> {
  /** This card's place in the tree, when the table is one. */
  treeEntry?: TreeEntry<TRow>;
  /** Open or close this node. */
  onToggleTree?: (id: string) => void;
  row: TRow;
  index: number;
  /** Stable row id (selection / expansion key). */
  id: string;
  columns: readonly ColumnDef<TRow>[];
  labels: Required<TableLabels>;
  confirm: ConfirmHandler;
  rowActions?: RowAction<TRow>[];
  /** Resolved `rowClassName(row, index)`, compared as a plain string. */
  className?: string;
  selected: boolean;
  expanded: boolean;
  /** Selection toggle — present only when selection is enabled. */
  onToggleSelect?: (id: string) => void;
  /** Expansion toggle — present only when `renderRowDetail` is set. */
  onToggleExpand?: (id: string) => void;
  renderDetail?: (row: TRow) => ReactNode;
  onRowClick?: (row: TRow) => void;
  measureElement?: (node: Element | null) => void;
  compact: boolean;
  dir?: "ltr" | "rtl";
  /**
   * Opt-in editing bundle — uncompared. Its identity changes on every
   * keystroke anywhere in the table; the per-row visual churn is
   * fingerprinted by `editingSignature` instead. A held card keeps an
   * older bundle safely: its handlers read live state through refs.
   */
  editing?: EditableCellEditing<TRow>;
  /** Page rows for Tab advance — uncompared (see `editing`). */
  rows: readonly TRow[];
  getRowId: (row: TRow) => string;
  /** Memo digest from {@link rowEditingSignature}. */
  editingSignature: string | null;
}

/** The card props the memo comparator deliberately skips (see `editing`). */
type UncomparedCardProp = "editing" | "rows" | "getRowId";

/** Every card prop the memo comparator checks with `Object.is`. */
const COMPARED_CARD_PROPS: readonly Exclude<
  keyof MobileCardProps<unknown>,
  UncomparedCardProp
>[] = [
  "row",
  "index",
  "id",
  "columns",
  "labels",
  "confirm",
  "rowActions",
  "className",
  "selected",
  "expanded",
  "onToggleSelect",
  "onToggleExpand",
  "renderDetail",
  "onRowClick",
  "measureElement",
  "compact",
  "dir",
  "editingSignature",
  // Or a folder opens and its own chevron never turns.
  "treeEntry",
];

/**
 * `React.memo` comparator: re-render a card only when one of its VISUAL
 * inputs changes — a search keystroke or another card's checkbox re-renders
 * the list shell, but every unchanged card bails out here.
 */
function mobileCardPropsEqual<TRow>(
  prev: Readonly<MobileCardProps<TRow>>,
  next: Readonly<MobileCardProps<TRow>>
): boolean {
  return COMPARED_CARD_PROPS.every((key) => Object.is(prev[key], next[key]));
}

/** One card. Memoized by {@link mobileCardPropsEqual} at the call site. */
function MobileCardBase<TRow>({
  row,
  index,
  id,
  columns,
  labels,
  confirm,
  rowActions,
  className,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  renderDetail,
  onRowClick,
  measureElement,
  compact,
  dir,
  editing,
  rows,
  getRowId,
  treeEntry,
  onToggleTree,
}: Readonly<MobileCardProps<TRow>>) {
  return (
    <Card
      ref={measureElement}
      data-index={index}
      data-stagger=""
      data-selected={selected ? "" : undefined}
      data-dirty={rowIsDirty(editing, id) ? "" : undefined}
      variant="outlined"
      role="listitem"
      className={className}
      {...rowClickProps(row, onRowClick, index)}
      style={treeCardStyle(treeEntry?.level ?? 0)}
    >
      <CardContent
        sx={compact ? { p: 1.25, "&:last-child": { pb: 1.25 } } : undefined}
      >
        {treeEntry && (
          <TreeToggle
            entry={treeEntry}
            labels={labels}
            onToggle={onToggleTree ?? (() => undefined)}
          />
        )}
        {onToggleSelect && (
          <Checkbox
            slotProps={{ input: { "aria-label": labels.selectRow } }}
            checked={selected}
            onChange={() => onToggleSelect(id)}
          />
        )}
        {onToggleExpand && (
          <ExpandToggle
            id={id}
            expanded={expanded}
            onToggle={onToggleExpand}
            dir={dir}
            expandLabel={labels.expandRow}
            collapseLabel={labels.collapseRow}
          />
        )}
        {columns.map((column) => (
          <Box key={column.key} sx={{ mb: compact ? 0.5 : 1 }}>
            {resolveMobileLabel(column) && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: "block" }}
              >
                {resolveMobileLabel(column)}
              </Typography>
            )}
            {/* Cells are arbitrary ReactNode (often block elements) —
                a <p> wrapper would be invalid HTML. */}
            <Typography component="div" variant="body2">
              <EditableDataCell
                editing={editing}
                row={row}
                column={column}
                rowId={id}
                rowIndex={index}
                rows={rows}
                columns={columns}
                rowKey={getRowId}
                editLabel={labels.editCell}
                undoLabel={labels.undoEdit}
              />
            </Typography>
          </Box>
        ))}
        {rowActions && rowActions.length > 0 && (
          <RowActionButtons
            row={row}
            actions={rowActions}
            confirm={confirm}
            cancelLabel={labels.cancel}
          />
        )}
        {expanded && renderDetail && (
          // Inside the card — and therefore inside the measured element —
          // so virtualization keeps accurate card heights.
          <Box sx={{ mt: 1 }}>{renderDetail(row)}</Box>
        )}
      </CardContent>
    </Card>
  );
}

/** Mobile MUI card list. */
export function MobileCards<TRow>({
  table,
  cardClassName,
  rows,
  rowActions,
  confirm,
  getRowId,
  size,
  dir,
  onRowClick,
  rowClassName,
  renderRowDetail,
  summaryRow,
  expansion,
  editing,
  grouping,
  tree,
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  const compact = size === "small";
  // Expansion is active only when BOTH halves arrived (the chrome supplies
  // `expansion` exactly when `renderRowDetail` is set).
  const expand = expansion && renderRowDetail ? expansion : undefined;
  // The summary renders as a final card. Header groups and multi-sort are
  // desktop-only concerns: cards have no column grid for a group to span and
  // no clickable headers to shift-click.
  const summaryCells = useSummaryCells(summaryRow, rows);

  // `memo` erases generics at module level, so the memoized card is
  // instantiated here (once — the identity is stable for the list's life).
  const CardItem = useMemo(
    () => memo(MobileCardBase<TRow>, mobileCardPropsEqual),
    []
  );

  const renderCard = (
    row: TRow,
    index: number,
    key: string,
    treeEntry?: TreeEntry<TRow>
  ): ReactElement => {
    const id = getRowId(row);
    return (
      <CardItem
        key={key}
        row={row}
        index={index}
        id={id}
        columns={columns}
        labels={labels}
        confirm={confirm}
        rowActions={rowActions}
        className={
          [cardClassName, rowClassName?.(row, index)]
            .filter(Boolean)
            .join(" ") || undefined
        }
        selected={selection ? selection.isSelected(id) : false}
        expanded={expand ? expand.isExpanded(id) : false}
        onToggleSelect={selection ? selection.toggle : undefined}
        onToggleExpand={expand ? expand.toggle : undefined}
        renderDetail={renderRowDetail}
        onRowClick={onRowClick}
        measureElement={measureElement}
        compact={compact}
        dir={dir}
        editing={editing}
        rows={rows}
        getRowId={getRowId}
        editingSignature={rowEditingSignature(editing, id)}
        treeEntry={treeEntry}
        onToggleTree={tree?.expansion.toggle}
      />
    );
  };

  return (
    <Stack
      spacing={compact ? 1 : 1.5}
      role="list"
      aria-label={table.getTableProps()["aria-label"]}
    >
      {paddingTop > 0 && <Box aria-hidden sx={{ height: paddingTop }} />}
      {grouping
        ? grouping.entries.map((entry) =>
            entry.kind === "group" ||
            entry.kind === "groupFooter" ||
            entry.kind === "groupMore" ? (
              <GroupHeaderCard
                key={entry.key}
                entry={entry}
                columns={columns}
                selection={selection}
                labels={labels}
                compact={compact}
                onToggleCollapse={(key) => grouping.collapsed.toggle(key)}
                onShowMore={grouping.showMore}
              />
            ) : (
              renderCard(entry.row, entry.index, entry.key)
            )
          )
        : bodyRowEntries(entries, tree).map(({ row, index, key, treeEntry }) =>
            renderCard(row, index, key, treeEntry)
          )}
      {summaryCells && (
        <Card variant="outlined" role="listitem">
          <CardContent
            sx={compact ? { p: 1.25, "&:last-child": { pb: 1.25 } } : undefined}
          >
            {columns.map((column) => {
              const value = summaryCells[column.key];
              // Unlike the desktop footer, a card has no columns to keep
              // aligned, so columns without a summary are simply skipped.
              if (value === undefined) return null;
              return (
                <Box key={column.key} sx={{ mb: compact ? 0.5 : 1 }}>
                  {resolveMobileLabel(column) && (
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ display: "block" }}
                    >
                      {resolveMobileLabel(column)}
                    </Typography>
                  )}
                  <Typography component="div" variant="body2">
                    {value}
                  </Typography>
                </Box>
              );
            })}
          </CardContent>
        </Card>
      )}
      {paddingBottom > 0 && <Box aria-hidden sx={{ height: paddingBottom }} />}
    </Stack>
  );
}
