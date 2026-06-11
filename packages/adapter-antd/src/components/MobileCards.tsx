import {
  type ColumnDef,
  type ConfirmHandler,
  resolveDisabledReason,
  type RowAction,
  rowClickProps,
  runRowAction,
  type TableLabels,
  type UseDataTableResult,
} from "@adapttable/core";
import { Button, Card, Checkbox, Descriptions, Space } from "antd";

import { isDangerColor } from "../colors";

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

/**
 * Mobile layout: one antd `Card` per row with an antd `Descriptions`
 * label/value list, an optional selection checkbox, and row actions. Shown
 * instead of the table on narrow viewports so columns never get cramped.
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
            <Card
              size="small"
              className={rowClassName?.(row, rowIndex)}
              {...rowClickProps(row, onRowClick)}
              onMouseEnter={prefetch ? () => prefetch(row) : undefined}
              title={
                selection ? (
                  <Checkbox
                    checked={selection.isSelected(id)}
                    aria-label={labels.selectRow}
                    onChange={() => selection.toggle(id)}
                  />
                ) : undefined
              }
              extra={
                rowActions && rowActions.length > 0 ? (
                  <CardActions
                    row={row}
                    rowActions={rowActions}
                    confirm={confirm}
                    labels={labels}
                  />
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
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
