import {
  type ColumnDef,
  columnResizeHandleProps,
  type ConfirmHandler,
  resolveDisabledReason,
  type RowAction,
  runRowAction,
  type SortDirection,
  type TableLabels,
} from "@adapttable/core";
import { Button, type TableColumnsType, Tooltip } from "antd";
import type { CSSProperties } from "react";

import { isDangerColor } from "./colors";

/** Inline style for an absolutely-positioned column-resize handle. */
const RESIZE_HANDLE_STYLE: CSSProperties = {
  position: "absolute",
  insetInlineEnd: 0,
  top: 0,
  height: "100%",
  width: 8,
  cursor: "col-resize",
  touchAction: "none",
  userSelect: "none",
};

/** Readable column label for the resize handle's accessible name. */
function columnLabel<TRow>(column: ColumnDef<TRow>): string {
  return typeof column.header === "string" ? column.header : column.key;
}

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
  /** Per-column edge pinning, mapped to antd's native `fixed`. */
  pinned?: Readonly<Record<string, "left" | "right">>;
  /** Layout width mutator; enables a resize handle when provided. */
  setWidth?: (key: string, width: number) => void;
  /** Per-column pixel widths from the layout state. */
  columnWidths?: Readonly<Record<string, number>>;
  /** Accessible label prefix for the resize handle. */
  resizeLabel?: string;
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
  pinned,
  setWidth,
  columnWidths,
  resizeLabel = "Resize column",
}: BuildColumnsOptions<TRow>): TableColumnsType<TRow> {
  const cols: TableColumnsType<TRow> = columns.map((column) => ({
    key: column.key,
    title: setWidth ? (
      <>
        {column.header}
        <span
          {...columnResizeHandleProps(
            column.key,
            setWidth,
            `${resizeLabel}: ${columnLabel(column)}`
          )}
          style={RESIZE_HANDLE_STYLE}
        />
      </>
    ) : (
      column.header
    ),
    width: columnWidths?.[column.key] ?? column.width,
    fixed: pinned?.[column.key],
    sorter: column.sortable ? true : undefined,
    sortOrder: column.sortable
      ? sortOrderFor(column.key, sortBy, sortDir)
      : undefined,
    showSorterTooltip: false,
    onCell: () => cellStyle(column.align),
    onHeaderCell: () => {
      // The resize handle is absolute, so the header cell needs a positioning
      // context for it.
      const style: CSSProperties = { textAlign: logicalAlign(column.align) };
      if (setWidth) style.position = "relative";
      return column.sortable
        ? { style, "aria-sort": ariaSortFor(column.key, sortBy, sortDir) }
        : { style };
    },
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
            const reason = resolveDisabledReason(action.disabledReason?.(row));
            const disabled =
              reason !== undefined || (action.isDisabled?.(row) ?? false);
            return (
              <Tooltip key={action.key} title={reason ?? action.label}>
                <Button
                  size="small"
                  type="text"
                  danger={isDangerColor(action.color)}
                  disabled={disabled}
                  title={reason}
                  aria-label={action.label}
                  // The disabled attribute already blocks activation, so
                  // attach the handler only when the action can run.
                  onClick={
                    disabled
                      ? undefined
                      : (e) => {
                          e.stopPropagation();
                          runRowAction(action, row, confirm, labels.cancel);
                        }
                  }
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
