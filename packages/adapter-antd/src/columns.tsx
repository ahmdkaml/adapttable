import {
  type ColumnDef,
  type ConfirmHandler,
  type RowAction,
  runRowAction,
  type SortDirection,
  type TableLabels,
} from "@adapttable/core";
import { Button, type TableColumnsType, Tooltip } from "antd";

import { isDangerColor } from "./colors";

/** Logical (RTL-aware) text alignment for a column. */
function logicalAlign(
  align: ColumnDef<unknown>["align"]
): "start" | "center" | "end" {
  if (align === "center") return "center";
  if (align === "end") return "end";
  return "start";
}

/** antd cell/header props applying logical alignment. */
function cellStyle(align: ColumnDef<unknown>["align"]): {
  style: { textAlign: "start" | "center" | "end" };
} {
  return { style: { textAlign: logicalAlign(align) } };
}

/** Map our sort state onto antd's `sortOrder` for a column. */
function sortOrderFor(
  columnKey: string,
  sortBy: string | undefined,
  sortDir: SortDirection | undefined
): "ascend" | "descend" | null {
  if (sortBy !== columnKey) return null;
  return sortDir === "desc" ? "descend" : "ascend";
}

/** `aria-sort` for a sortable header — antd's `<Table>` doesn't emit it. */
function ariaSortFor(
  columnKey: string,
  sortBy: string | undefined,
  sortDir: SortDirection | undefined
): "ascending" | "descending" | "none" {
  if (sortBy !== columnKey) return "none";
  return sortDir === "desc" ? "descending" : "ascending";
}

/** Options for {@link buildColumns}. */
export interface BuildColumnsOptions<TRow> {
  columns: readonly ColumnDef<TRow>[];
  rowActions?: readonly RowAction<TRow>[];
  sortBy: string | undefined;
  sortDir: SortDirection | undefined;
  confirm: ConfirmHandler;
  labels: Required<TableLabels>;
}

/**
 * Translate AdaptTable {@link ColumnDef}s into antd's `columns` config,
 * wiring sort order, logical alignment, custom `Cell` renderers, and an
 * optional trailing actions column. antd's `<Table>` then drives the header
 * sort carets and (via the parent's `onChange`) reports clicks back.
 *
 * @typeParam TRow - The row type.
 * @returns The antd column definitions.
 */
export function buildColumns<TRow>({
  columns,
  rowActions,
  sortBy,
  sortDir,
  confirm,
  labels,
}: BuildColumnsOptions<TRow>): TableColumnsType<TRow> {
  const cols: TableColumnsType<TRow> = columns.map((column) => ({
    key: column.key,
    title: column.header,
    width: column.width,
    sorter: column.sortable ? true : undefined,
    sortOrder: column.sortable
      ? sortOrderFor(column.key, sortBy, sortDir)
      : undefined,
    showSorterTooltip: false,
    onCell: () => cellStyle(column.align),
    onHeaderCell: () =>
      column.sortable
        ? {
            ...cellStyle(column.align),
            "aria-sort": ariaSortFor(column.key, sortBy, sortDir),
          }
        : cellStyle(column.align),
    render: (_value: unknown, row: TRow, index: number) =>
      column.Cell ? (
        <column.Cell row={row} rowIndex={index} />
      ) : (
        column.accessor?.(row)
      ),
  }));

  if (rowActions && rowActions.length > 0) {
    cols.push({
      key: "__actions__",
      title: labels.actions,
      width: 1,
      onCell: () => cellStyle("end"),
      onHeaderCell: () => cellStyle("end"),
      render: (_value: unknown, row: TRow) => (
        <div style={{ display: "flex", gap: 4, justifyContent: "flex-end" }}>
          {rowActions.map((action) => {
            if (action.isHidden?.(row)) return null;
            return (
              <Tooltip key={action.key} title={action.label}>
                <Button
                  size="small"
                  type="text"
                  danger={isDangerColor(action.color)}
                  disabled={action.isDisabled?.(row) ?? false}
                  aria-label={action.label}
                  onClick={(e) => {
                    e.stopPropagation();
                    runRowAction(action, row, confirm, labels.cancel);
                  }}
                >
                  {action.icon ?? action.label}
                </Button>
              </Tooltip>
            );
          })}
        </div>
      ),
    });
  }

  return cols;
}
