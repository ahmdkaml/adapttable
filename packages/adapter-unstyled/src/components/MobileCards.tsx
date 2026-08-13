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
  RowEditActions,
  rowEditingSignature,
  rowIsDirty,
  TreeToggle,
  useSummaryCells,
} from "@adapttable/core/adapter";
import type { ReactElement, ReactNode } from "react";
import { memo, useMemo } from "react";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";
import { type SharedProps } from "./DesktopTable";
import { EditableDataCell } from "./EditableCell";
import { ExpandButton } from "./ExpandToggle";
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
  classNames: DataTableClassNames;
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
  clickable: boolean;
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
  "classNames",
  "className",
  "selected",
  "expanded",
  "onToggleSelect",
  "onToggleExpand",
  "renderDetail",
  "onRowClick",
  "measureElement",
  "clickable",
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
  classNames,
  className,
  selected,
  expanded,
  onToggleSelect,
  onToggleExpand,
  renderDetail,
  onRowClick,
  measureElement,
  clickable,
  editing,
  rows,
  getRowId,
  treeEntry,
  onToggleTree,
}: Readonly<MobileCardProps<TRow>>) {
  return (
    <li
      {...rowClickProps(row, onRowClick, index)}
      style={treeCardStyle(treeEntry?.level ?? 0)}
      ref={measureElement}
      data-index={index}
      data-adapttable-part="card"
      data-stagger=""
      data-selected={selected ? "" : undefined}
      data-dirty={rowIsDirty(editing, id) ? "" : undefined}
      data-clickable={clickable ? "" : undefined}
      className={cx(classNames.card, className)}
    >
      {treeEntry && (
        <TreeToggle
          toggleClassName={classNames.treeToggle}
          spacerClassName={classNames.treeSpacer}
          entry={treeEntry}
          labels={labels}
          onToggle={onToggleTree ?? (() => undefined)}
        />
      )}
      {onToggleSelect && (
        <input
          type="checkbox"
          data-adapttable-part="checkbox"
          aria-label={labels.selectRow}
          checked={selected}
          onChange={() => onToggleSelect(id)}
          className={classNames.checkbox}
        />
      )}
      {onToggleExpand && (
        <ExpandButton
          expanded={expanded}
          labels={labels}
          classNames={classNames}
          onToggle={() => onToggleExpand(id)}
        />
      )}
      {columns.map((column) => (
        <div
          key={column.key}
          data-adapttable-part="card-row"
          className={classNames.cardRow}
        >
          {resolveMobileLabel(column) && (
            <span
              data-adapttable-part="card-label"
              className={classNames.cardLabel}
            >
              {resolveMobileLabel(column)}
            </span>
          )}
          <span
            data-adapttable-part="card-value"
            className={classNames.cardValue}
          >
            <EditableDataCell
              activateClassName={classNames.editCellActivate}
              errorClassName={classNames.editCellError}
              saveErrorClassName={classNames.editCellSaveError}
              rollbackClassName={classNames.editCellRollback}
              editorClassName={classNames.editCellEditor}
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
          </span>
        </div>
      ))}
      {editing?.rowEditing && (
        <RowEditActions
          rowEditing={editing.rowEditing}
          row={row}
          rowId={id}
          labels={labels}
        />
      )}
      {rowActions && rowActions.length > 0 && (
        <div
          data-adapttable-part="card-actions"
          className={classNames.cardActions}
        >
          <RowActionButtons
            row={row}
            actions={rowActions}
            confirm={confirm}
            cancelLabel={labels.cancel}
            classNames={classNames}
          />
        </div>
      )}
      {expanded && renderDetail && (
        <div
          data-adapttable-part="card-detail"
          className={classNames.cardDetail}
        >
          {renderDetail(row)}
        </div>
      )}
    </li>
  );
}

/** Mobile card-list rendering. */
export function MobileCards<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  classNames,
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
  const expansionState = renderRowDetail ? expansion : undefined;
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
        classNames={classNames}
        className={rowClassName?.(row, index)}
        selected={selection ? selection.isSelected(id) : false}
        expanded={expansionState ? expansionState.isExpanded(id) : false}
        onToggleSelect={selection ? selection.toggle : undefined}
        onToggleExpand={expansionState ? expansionState.toggle : undefined}
        renderDetail={renderRowDetail}
        onRowClick={onRowClick}
        measureElement={measureElement}
        clickable={Boolean(onRowClick)}
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
    <ul
      {...table.getTableProps({ role: undefined })}
      data-adapttable-part="cards"
      className={classNames.cards}
      // No `list-style: none` here: Safari/VoiceOver strips list semantics
      // from such lists. Markers are suppressed per-item with display:block.
      style={{ margin: 0, padding: 0 }}
    >
      {paddingTop > 0 && (
        <li
          data-adapttable-part="virtual-spacer"
          className={classNames.virtualSpacer}
          style={{ display: "block", height: paddingTop }}
        />
      )}
      {grouping
        ? grouping.entries.map((entry) =>
            entry.kind === "group" ||
            entry.kind === "groupFooter" ||
            entry.kind === "groupMore" ? (
              <li key={entry.key} style={{ display: "block" }}>
                <GroupHeaderCard
                  entry={entry}
                  columns={columns}
                  selection={selection}
                  labels={labels}
                  classNames={classNames}
                  onToggleCollapse={(key) => grouping.collapsed.toggle(key)}
                  onShowMore={grouping.showMore}
                />
              </li>
            ) : (
              renderCard(entry.row, entry.index, entry.key)
            )
          )
        : bodyRowEntries(entries, tree).map(({ row, index, key, treeEntry }) =>
            renderCard(row, index, key, treeEntry)
          )}
      {paddingBottom > 0 && (
        <li
          data-adapttable-part="virtual-spacer"
          className={classNames.virtualSpacer}
          style={{ display: "block", height: paddingBottom }}
        />
      )}
      {summary && (
        <li
          data-adapttable-part="summary-card"
          className={cx(classNames.card, classNames.summaryCard)}
          style={{ display: "block" }}
        >
          {columns.map((column) =>
            summary[column.key] == null ? null : (
              <div
                key={column.key}
                data-adapttable-part="card-row"
                className={classNames.cardRow}
              >
                {resolveMobileLabel(column) && (
                  <span
                    data-adapttable-part="card-label"
                    className={classNames.cardLabel}
                  >
                    {resolveMobileLabel(column)}
                  </span>
                )}
                <span
                  data-adapttable-part="card-value"
                  className={classNames.cardValue}
                >
                  {summary[column.key]}
                </span>
              </div>
            )
          )}
        </li>
      )}
    </ul>
  );
}
