import type { ColumnDef } from "@adapttable/core";
import {
  columnResizeHandleProps,
  tableMinWidth,
} from "@adapttable/core";
import {
  columnFlexShares,
  columnSizeStyle,
  fittedTableStyle,
  pinnedColumnWidth,
  type PinOffset,
  type SharedTableRenderProps,
  tableRenderModel,
} from "@adapttable/core/adapter";
import type { CSSProperties } from "react";

import { Table } from "./primitives";

const RESIZE_HANDLE_STYLE: CSSProperties = {
  position: "absolute",
  insetInlineEnd: 0,
  top: 0,
  height: "100%",
  width: "8px",
  cursor: "col-resize",
  touchAction: "none",
  userSelect: "none",
  zIndex: 10,
};

function getPinStyle(
  offset: PinOffset | undefined,
  zIndex: number
): CSSProperties {
  if (!offset) return {};
  const isStart = offset.side === "start";
  return {
    position: "sticky",
    zIndex,
    backgroundColor: "var(--bs-body-bg, #fff)",
    ...(isStart
      ? { insetInlineStart: `${offset.inset}px` }
      : { insetInlineEnd: `${offset.inset}px` }),
  };
}

export function DesktopTable<TRow>(
  props: Readonly<SharedTableRenderProps<TRow>>
) {
  const {
    table,
    rows,
    pinOffset,
    getRowId = table.getRowKey,
    columnWidths,
    setWidth,
    resizeLabel = "Resize column",
    fitColumns,
  } = props;

  const renderModel = tableRenderModel({
    table,
    rows,
    getRowId,
    pinOffset,
  });

  const columns = renderModel.columns;

  const flexShares = columnFlexShares({
    columns,
    fitColumns,
    widths: columnWidths,
  });

  const minWidth = tableMinWidth(columns, {
    widths: columnWidths,
  });

  const getHeaderName = (col: ColumnDef<TRow>): string =>
    typeof col.header === "string" ? col.header : col.key;

  return (
    <div style={{ overflowX: "auto" }}>
      <Table>
        <table
          className="table align-middle mb-0"
          style={{
            minWidth: minWidth > 0 ? `${minWidth}px` : undefined,
            ...fittedTableStyle(fitColumns),
          }}
        >
          <thead>
            <tr {...table.getHeaderRowProps()}>
              {columns.map((column) => {
                const key = String(column.key);
                const offset = pinOffset?.(column.key);
                const pinStyle = getPinStyle(offset, 2);
                const width = offset
                  ? pinnedColumnWidth(column, columnWidths)
                  : columnWidths?.[key] ?? column.width;
                const sizing = columnSizeStyle(column, flexShares, columnWidths?.[key]);

                const sortButton = table.getSortButtonProps?.(column);
                const ariaSort = table.getHeaderCellProps(column)["aria-sort"] as
                  | "ascending"
                  | "descending"
                  | "none"
                  | undefined;

                return (
                  <th
                    key={key}
                    {...table.getHeaderCellProps(column)}
                    aria-sort={ariaSort}
                    style={{
                      position: pinStyle.position ?? (setWidth ? "relative" : undefined),
                      width,
                      minWidth: width,
                      ...sizing,
                      ...pinStyle,
                    }}
                  >
                    <div className="d-flex align-items-center justify-content-between position-relative">
                      {column.sortable && sortButton ? (
                        <button
                          type="button"
                          className="btn btn-link p-0 text-decoration-none text-reset fw-bold d-inline-flex align-items-center gap-1"
                          onClick={sortButton.onClick}
                          aria-label={`${table.labels.sortBy}: ${getHeaderName(column)}`}
                        >
                          <span>{column.header}</span>
                          <span aria-hidden="true"> ^ </span>
                        </button>
                      ) : (
                        <span>{column.header}</span>
                      )}

                      {setWidth && (
                        <span
                          style={RESIZE_HANDLE_STYLE}
                          {...columnResizeHandleProps(
                            column.key,
                            setWidth,
                            `${resizeLabel}: ${getHeaderName(column)}`
                          )}
                        />
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>

          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={table.getRowKey(row)} {...table.getRowProps(row, rowIndex)}>
                {columns.map((column) => {
                  const key = String(column.key);
                  const offset = pinOffset?.(column.key);
                  const pinStyle = getPinStyle(offset, 1);
                  const width = offset
                    ? pinnedColumnWidth(column, columnWidths)
                    : columnWidths?.[key] ?? column.width;
                  const sizing = columnSizeStyle(column, flexShares, columnWidths?.[key]);

                  return (
                    <td
                      key={key}
                      {...table.getCellProps(column)}
                      style={{
                        width,
                        minWidth: width,
                        ...sizing,
                        ...pinStyle,
                      }}
                    >
                      {table.getCellContent
                        ? table.getCellContent(column, row, rowIndex)
                        : column.accessor?.(row)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </Table>
    </div>
  );
}
