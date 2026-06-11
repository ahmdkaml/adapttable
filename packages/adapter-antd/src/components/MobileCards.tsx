import {
  type ColumnDef,
  type ConfirmHandler,
  resolveDisabledReason,
  type RowAction,
  rowClickProps,
  type RowExpansionState,
  runRowAction,
  type TableLabels,
  type UseDataTableResult,
} from "@adapttable/core";
import { Button, Card, Checkbox, Descriptions, Space } from "antd";
import { type ReactNode, useMemo } from "react";

import { isDangerColor } from "../colors";
import { ExpandToggle } from "./ExpandToggle";

/** The mobile-card label for a column: explicit `mobileLabel`, else a string
 * `header`, else the column key. */
function cardLabel<TRow>(column: ColumnDef<TRow>): string {
  if (column.mobileLabel) return column.mobileLabel;
  return typeof column.header === "string" ? column.header : column.key;
}

/** Row-action buttons for a single card. */
function CardActions<TRow>({
  row,
  rowActions,
  confirm,
  labels,
}: Readonly<{
  row: TRow;
  rowActions: readonly RowAction<TRow>[];
  confirm: ConfirmHandler;
  labels: Required<TableLabels>;
}>) {
  return (
    <Space size="small" wrap>
      {rowActions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        return (
          <Button
            key={action.key}
            size="small"
            danger={isDangerColor(action.color)}
            disabled={disabled}
            title={reason}
            aria-label={action.label}
            // The disabled attribute already blocks activation, so attach
            // the handler only when the action can run.
            onClick={
              disabled
                ? undefined
                : () => runRowAction(action, row, confirm, labels.cancel)
            }
          >
            {action.icon ?? action.label}
          </Button>
        );
      })}
    </Space>
  );
}

/** Per-card inputs for the memoized {@link CardItem}. */
interface CardItemProps<TRow> {
  row: TRow;
  rowIndex: number;
  /** Stable row id (selection / expansion key). */
  id: string;
  columns: ColumnDef<TRow>[];
  labels: Required<TableLabels>;
  confirm: ConfirmHandler;
  rowActions?: readonly RowAction<TRow>[];
  /** Resolved `rowClassName(row, index)`, compared as a plain string. */
  className?: string;
  selected: boolean;
  expanded: boolean;
  /** Selection toggle — present only when selection is enabled. */
  onToggleSelect?: (id: string) => void;
  /** Expansion toggle — present only when `renderRowDetail` is set. */
  onToggleExpand?: (id: string) => void;
  /** Detail-panel renderer — see `BaseDataTableProps.renderRowDetail`. */
  renderDetail?: (row: TRow) => ReactNode;
  /** Row activation handler — see `BaseDataTableProps.onRowClick`. */
  onRowClick?: (row: TRow) => void;
  prefetch?: (row: TRow) => void;
}

/**
 * One memoized card. `React.memo` cannot keep `TRow` generic without a type
 * cast, so the card memoizes its rendered element instead: the dependency
 * list below IS the `areEqual` contract — row identity, the selected /
 * expanded flags, and the visual inputs — and React reuses the previous
 * subtree (column accessors and all) whenever none of them changed. The
 * callbacks must therefore be referentially stable across unrelated renders;
 * `selection.toggle` (whose identity tracks the selection by design) is in
 * the list, so a selection change still reaches every card un-stale.
 */
function CardItem<TRow>(props: Readonly<CardItemProps<TRow>>) {
  const {
    row,
    rowIndex,
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
    prefetch,
  } = props;
  return useMemo(() => {
    const actions = rowActions && rowActions.length > 0 ? rowActions : null;
    return (
      <Card
        size="small"
        className={className}
        {...rowClickProps(row, onRowClick)}
        onMouseEnter={prefetch ? () => prefetch(row) : undefined}
        title={
          onToggleSelect ? (
            <Checkbox
              checked={selected}
              aria-label={labels.selectRow}
              onChange={() => onToggleSelect(id)}
            />
          ) : undefined
        }
        extra={
          (onToggleExpand ?? actions) ? (
            <Space size="small">
              {onToggleExpand && (
                <ExpandToggle
                  expanded={expanded}
                  labels={labels}
                  onClick={() => onToggleExpand(id)}
                />
              )}
              {actions && (
                <CardActions
                  row={row}
                  rowActions={actions}
                  confirm={confirm}
                  labels={labels}
                />
              )}
            </Space>
          ) : undefined
        }
      >
        <Descriptions column={1} size="small" colon={false}>
          {columns.map((column) => (
            <Descriptions.Item key={column.key} label={cardLabel(column)}>
              {column.Cell ? (
                <column.Cell row={row} rowIndex={rowIndex} />
              ) : (
                column.accessor?.(row)
              )}
            </Descriptions.Item>
          ))}
        </Descriptions>
        {expanded && renderDetail ? (
          <div data-adapttable-part="card-detail" style={{ marginTop: 8 }}>
            {renderDetail(row)}
          </div>
        ) : null}
      </Card>
    );
  }, [
    row,
    rowIndex,
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
    prefetch,
  ]);
}

/**
 * Mobile layout: one antd `Card` per row with an antd `Descriptions`
 * label/value list, an optional selection checkbox, an optional expandable
 * detail section, and row actions. Shown instead of the table on narrow
 * viewports so columns never get cramped. Each card is memoized on its own
 * inputs, so a toolbar re-render (e.g. a search keystroke) re-renders no
 * unchanged card.
 *
 * @typeParam TRow - The row type.
 */
export function MobileCards<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  prefetch,
  onRowClick,
  rowClassName,
  tableLabel,
  compact = false,
  expansion,
  renderRowDetail,
}: Readonly<{
  table: UseDataTableResult<TRow>;
  rows: readonly TRow[];
  rowActions?: readonly RowAction<TRow>[];
  confirm: ConfirmHandler;
  getRowId: (row: TRow) => string;
  prefetch?: (row: TRow) => void;
  /** Row activation handler — see `BaseDataTableProps.onRowClick`. */
  onRowClick?: (row: TRow) => void;
  /** Conditional per-row class — see `BaseDataTableProps.rowClassName`. */
  rowClassName?: (row: TRow, index: number) => string | undefined;
  tableLabel?: string;
  /** Tighter card rhythm for the `"compact"` density. */
  compact?: boolean;
  /** Row-expansion state — present only when `renderRowDetail` is set. */
  expansion?: RowExpansionState;
  /** Detail-panel renderer — see `BaseDataTableProps.renderRowDetail`. */
  renderRowDetail?: (row: TRow) => ReactNode;
}>) {
  const { labels, selection, columns } = table;
  return (
    <ul
      data-adapttable-part="cards"
      aria-label={tableLabel}
      style={{
        listStyle: "none",
        margin: 0,
        padding: 0,
        display: "flex",
        flexDirection: "column",
        gap: compact ? 4 : 8,
      }}
    >
      {rows.map((row, rowIndex) => {
        const id = getRowId(row);
        return (
          <li key={id}>
            <CardItem
              row={row}
              rowIndex={rowIndex}
              id={id}
              columns={columns}
              labels={labels}
              confirm={confirm}
              rowActions={rowActions}
              className={rowClassName?.(row, rowIndex)}
              selected={selection ? selection.isSelected(id) : false}
              expanded={expansion ? expansion.isExpanded(id) : false}
              onToggleSelect={selection ? selection.toggle : undefined}
              onToggleExpand={expansion ? expansion.toggle : undefined}
              renderDetail={renderRowDetail}
              onRowClick={onRowClick}
              prefetch={prefetch}
            />
          </li>
        );
      })}
    </ul>
  );
}
