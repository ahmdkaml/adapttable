/** The responsive card list rendered in place of the table on narrow screens. */
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
  RowEditActions,
  rowEditingSignature,
  rowIsDirty,
  TreeToggle,
  useSummaryCells,
} from "@adapttable/core/adapter";
import { Box, Card, Flex, Text } from "@radix-ui/themes";
import { memo, type ReactNode, useMemo } from "react";

import type { RadixAccentColor } from "../types";
import { type SharedProps } from "./DesktopTable";
import { EditableDataCell } from "./EditableCell";
import { ExpandToggle } from "./ExpandToggle";
import { GroupHeaderCard } from "./GroupHeader";
import { Checkbox } from "./primitives";
import { RowActionButtons } from "./RowActionButtons";

/** Join the static class hook with a conditional per-row class. */
function joinClasses(
  base: string | undefined,
  extra: string | undefined
): string | undefined {
  if (base && extra) return `${base} ${extra}`;
  return base ?? extra;
}

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
  /** Static list class merged with resolved `rowClassName` output. */
  className?: string;
  selected: boolean;
  expanded: boolean;
  /** Selection toggle — present only when selection is enabled. */
  onToggleSelect?: (id: string) => void;
  /** Expansion toggle — present only when expansion is enabled. */
  onToggleExpand?: (id: string) => void;
  renderDetail?: (row: TRow) => ReactNode;
  onRowClick?: (row: TRow) => void;
  measureElement?: (node: Element | null) => void;
  compact: boolean;
  dir?: "ltr" | "rtl";
  accentColor?: RadixAccentColor;
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
  "accentColor",
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
  accentColor,
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
      size={compact ? "1" : "2"}
      role="listitem"
      className={className}
      {...rowClickProps(row, onRowClick, index)}
      style={treeCardStyle(treeEntry?.level ?? 0)}
    >
      {treeEntry && (
        <TreeToggle
          entry={treeEntry}
          labels={labels}
          onToggle={onToggleTree ?? (() => undefined)}
        />
      )}
      {onToggleSelect && (
        <Box mb="2">
          <Checkbox
            aria-label={labels.selectRow}
            checked={selected}
            onToggle={() => onToggleSelect(id)}
          />
        </Box>
      )}
      {onToggleExpand && (
        <Box mb="2">
          <ExpandToggle
            open={expanded}
            dir={dir}
            labels={labels}
            onToggle={() => onToggleExpand(id)}
          />
        </Box>
      )}
      {columns.map((column) => (
        <Box key={column.key} mb={compact ? "1" : "2"}>
          {resolveMobileLabel(column) && (
            <Text
              as="div"
              size="1"
              color="gray"
              style={{ textTransform: "uppercase" }}
            >
              {resolveMobileLabel(column)}
            </Text>
          )}
          <Text as="div" size="2">
            <EditableDataCell
              editing={editing}
              row={row}
              column={column}
              rowId={id}
              rows={rows}
              columns={columns}
              rowKey={getRowId}
              editLabel={labels.editCell}
              undoLabel={labels.undoEdit}
              display={
                column.Cell ? (
                  <column.Cell row={row} rowIndex={index} />
                ) : (
                  column.accessor?.(row)
                )
              }
            />
          </Text>
        </Box>
      ))}
      {expanded && <Box pt="1">{renderDetail?.(row)}</Box>}
      {editing?.rowEditing && (
        <RowEditActions
          rowEditing={editing.rowEditing}
          row={row}
          rowId={id}
          labels={labels}
        />
      )}
      {rowActions && rowActions.length > 0 && (
        <RowActionButtons
          row={row}
          actions={rowActions}
          confirm={confirm}
          cancelLabel={labels.cancel}
          accentColor={accentColor}
        />
      )}
    </Card>
  );
}

/** Mobile Radix Themes card list. */
export function MobileCards<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  size,
  accentColor,
  dir,
  onRowClick,
  rowClassName,
  renderRowDetail,
  summaryRow,
  expansion,
  editing,
  grouping,
  tree,
  className,
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  const compact = size === "1";
  const summary = useSummaryCells(summaryRow, rows);

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
  ) => {
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
        className={joinClasses(className, rowClassName?.(row, index))}
        selected={selection ? selection.isSelected(id) : false}
        expanded={expansion ? expansion.isExpanded(id) : false}
        onToggleSelect={selection ? selection.toggle : undefined}
        onToggleExpand={expansion ? expansion.toggle : undefined}
        renderDetail={renderRowDetail}
        onRowClick={onRowClick}
        measureElement={measureElement}
        compact={compact}
        dir={dir}
        accentColor={accentColor}
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
    <Flex
      direction="column"
      gap={compact ? "2" : "3"}
      role="list"
      aria-label={table.getTableProps()["aria-label"]}
    >
      {paddingTop > 0 && <Box aria-hidden style={{ height: paddingTop }} />}
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
                dir={dir}
                accentColor={accentColor}
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
      {paddingBottom > 0 && (
        <Box aria-hidden style={{ height: paddingBottom }} />
      )}
      {summary && (
        <Card size={compact ? "1" : "2"} role="listitem" className={className}>
          {columns.map((column) => {
            const value = summary[column.key];
            // Columns absent from the summary are skipped — a card has no grid
            // to keep aligned, so empty entries are just noise.
            if (value === undefined) return null;
            return (
              <Box key={column.key} mb={compact ? "1" : "2"}>
                {resolveMobileLabel(column) && (
                  <Text
                    as="div"
                    size="1"
                    color="gray"
                    style={{ textTransform: "uppercase" }}
                  >
                    {resolveMobileLabel(column)}
                  </Text>
                )}
                <Text as="div" size="2" weight="bold">
                  {value}
                </Text>
              </Box>
            );
          })}
        </Card>
      )}
    </Flex>
  );
}
