import {
  type ColumnDef,
  columnResizeHandleProps,
  type ConfirmHandler,
  edgePinStyle,
  PIN_Z,
  type PinLeads,
  pinnedCellStyle,
  pinnedColumnWidth,
  resolveDisabledReason,
  resolveVirtualRows,
  type RowAction,
  rowClickProps,
  runRowAction,
  type SharedTableRenderProps,
  tableMinWidth,
  tableRenderModel,
} from "@adapttable/core";
import type { CSSProperties, MouseEvent } from "react";

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

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

interface SharedProps<TRow> extends SharedTableRenderProps<TRow> {
  classNames: DataTableClassNames;
}

function RowActionButtons<TRow>({
  row,
  actions,
  confirm,
  cancelLabel,
  classNames,
}: Readonly<{
  row: TRow;
  actions: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
  classNames: DataTableClassNames;
}>) {
  return (
    <>
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        // The disabled attribute already blocks activation, so attach the
        // handler only when the action can run.
        const handleClick = disabled
          ? undefined
          : (e: MouseEvent) => {
              e.stopPropagation();
              runRowAction(action, row, confirm, cancelLabel);
            };
        return (
          <button
            key={action.key}
            type="button"
            disabled={disabled}
            title={reason}
            aria-label={action.label}
            data-adapttable-part="action-button"
            data-color={action.color}
            className={classNames.actionButton}
            onClick={handleClick}
          >
            {action.icon ?? action.label}
          </button>
        );
      })}
    </>
  );
}

/** Desktop semantic `<table>` rendering. */
export function DesktopTable<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  classNames,
  prefetch,
  onRowClick,
  rowClassName,
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
  stickyHeader = false,
  stickyTop = 0,
  pinOffset,
  maxHeight,
  setWidth,
  columnWidths,
  resizeLabel = "Resize column",
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels, showActions, entries, columnSpan } =
    tableRenderModel({ table, rows, rowActions, getRowId, rowEntries });
  // Stick the header *cells* (a `<thead>` does not pin against the document
  // scroller). The adapter ships no colours, so consumers must give their
  // `headerCell` class an opaque background — the `data-sticky`/`data-pinned`
  // hooks make that easy to target.
  // Inside a maxHeight scroll box the box itself is the sticky context, so
  // the header pins to ITS top — a viewport offset would float it mid-box.
  const stickyStyle: CSSProperties | undefined = stickyHeader
    ? {
        position: "sticky",
        top: maxHeight == null ? stickyTop : 0,
        zIndex: PIN_Z.header,
      }
    : undefined;
  const stickyAttr = stickyHeader || undefined;
  // The leading checkbox (44px) and trailing actions (120px) columns pin to the
  // edge alongside the data columns, which therefore start past them.
  const selectionWidth = 44;
  const actionsWidth = 120;
  const leads: PinLeads = {
    left: selection ? selectionWidth : 0,
    right: showActions ? actionsWidth : 0,
  };
  const hasLeftPin = columns.some((c) => pinOffset?.(c.key)?.side === "left");
  const hasRightPin = columns.some((c) => pinOffset?.(c.key)?.side === "right");
  // Pinned header cells need both the sticky-top and sticky-left/right styles;
  // body cells only the side. Header pins sit above the sticky header so later
  // headers never paint over them on horizontal scroll.
  const headPinStyle = (key: string): CSSProperties | undefined =>
    pinnedCellStyle(pinOffset?.(key), PIN_Z.headerPinned, leads);
  const bodyPinStyle = (key: string): CSSProperties | undefined =>
    pinnedCellStyle(pinOffset?.(key), PIN_Z.body, leads);
  const headStyle = (column: ColumnDef<TRow>): CSSProperties | undefined => {
    const key = column.key;
    const pin = headPinStyle(key);
    // A pinned column renders at the width its sticky inset assumed, so
    // stacked pins stay flush even with no declared width.
    const width = pin
      ? pinnedColumnWidth(column, columnWidths)
      : columnWidths?.[key];
    if (!stickyStyle && !pin && width == null && !setWidth) return undefined;
    // Leave `width` out when unset so merging never clobbers the declared
    // column width the core prop-getter already provides.
    const merged: CSSProperties = {
      ...stickyStyle,
      ...pin,
      ...(width != null && { width }),
    };
    // The resize handle is absolutely positioned, so the cell needs a
    // positioning context when it is not already sticky/pinned.
    if (setWidth && !merged.position) merged.position = "relative";
    return merged;
  };
  // The checkbox / actions edge cells pin to their side when a data column
  // there is pinned (corner-sticky in the header).
  const edgeHeadStyle = (
    side: "left" | "right",
    active: boolean
  ): CSSProperties | undefined => {
    const edge = edgePinStyle(side, active, PIN_Z.headerPinned);
    if (!stickyStyle && !edge) return undefined;
    return { ...stickyStyle, ...edge };
  };
  const columnName = (column: ColumnDef<TRow>): string =>
    typeof column.header === "string" ? column.header : column.key;
  // Fixed-width columns get a real table min-width (their sum), so the table
  // overflows and scrolls horizontally instead of squishing columns to fit.
  const minWidth = tableMinWidth(columns, {
    widths: columnWidths,
    extra: (selection ? selectionWidth : 0) + (showActions ? actionsWidth : 0),
  });

  const tableEl = (
    <table
      {...table.getTableProps()}
      data-adapttable-part="table"
      className={classNames.table}
      style={minWidth > 0 ? { minWidth } : undefined}
    >
      <thead data-adapttable-part="thead" className={classNames.thead}>
        <tr
          {...table.getHeaderRowProps()}
          data-adapttable-part="header-row"
          className={classNames.headerRow}
        >
          {selection && (
            <th
              data-adapttable-part="selection-header"
              data-sticky={stickyAttr}
              data-pinned={hasLeftPin ? "left" : undefined}
              style={edgeHeadStyle("left", hasLeftPin)}
              className={cx(classNames.headerCell, classNames.selectionCell)}
            >
              <input
                type="checkbox"
                aria-label={labels.selectAll}
                checked={selection.headerState === "all"}
                ref={(el) => {
                  if (el) el.indeterminate = selection.headerState === "some";
                }}
                onChange={selection.toggleAll}
                className={classNames.checkbox}
              />
            </th>
          )}
          {columns.map((column) => {
            // Route the local sticky/pin/width style THROUGH the prop-getter
            // so it merges with core's alignment + declared width instead of
            // replacing them (a bare `style=` after the spread would).
            const localStyle = headStyle(column);
            const headerProps = table.getHeaderCellProps(
              column,
              localStyle && { style: localStyle }
            );
            const active = table.sortBy === column.key;
            return (
              <th
                key={column.key}
                {...headerProps}
                data-adapttable-part="header-cell"
                data-sorted={active ? table.sortDir : undefined}
                data-sticky={stickyAttr}
                data-pinned={pinOffset?.(column.key)?.side}
                className={classNames.headerCell}
              >
                {column.sortable ? (
                  <button
                    {...table.getSortButtonProps(column)}
                    data-adapttable-part="sort-button"
                    className={classNames.sortButton}
                  >
                    {column.header}
                    <span aria-hidden> {sortGlyph(active, table.sortDir)}</span>
                  </button>
                ) : (
                  column.header
                )}
                {setWidth && (
                  <span
                    {...columnResizeHandleProps(
                      column.key,
                      setWidth,
                      `${resizeLabel}: ${columnName(column)}`
                    )}
                    data-adapttable-part="resize-handle"
                    className={classNames.resizeHandle}
                    style={RESIZE_HANDLE_STYLE}
                  />
                )}
              </th>
            );
          })}
          {showActions && (
            <th
              data-adapttable-part="actions-header"
              data-sticky={stickyAttr}
              data-pinned={hasRightPin ? "right" : undefined}
              style={edgeHeadStyle("right", hasRightPin)}
              className={cx(classNames.headerCell, classNames.actionsCell)}
            >
              {labels.actions}
            </th>
          )}
        </tr>
      </thead>
      <tbody data-adapttable-part="tbody" className={classNames.tbody}>
        {paddingTop > 0 && (
          <tr>
            <td
              colSpan={columnSpan}
              style={{ height: paddingTop, padding: 0 }}
            />
          </tr>
        )}
        {entries.map(({ row, index, key }) => {
          const id = getRowId(row);
          const rowProps = { ...table.getRowProps(row, index) };
          delete rowProps.key;
          return (
            <tr
              key={key}
              {...rowProps}
              {...rowClickProps(row, onRowClick)}
              ref={measureElement}
              data-adapttable-part="row"
              data-selected={selection?.isSelected(id) ? "" : undefined}
              data-clickable={onRowClick ? "" : undefined}
              className={cx(classNames.row, rowClassName?.(row, index))}
              onMouseEnter={prefetch ? () => prefetch(row) : undefined}
            >
              {selection && (
                <td
                  data-adapttable-part="selection-cell"
                  data-pinned={hasLeftPin ? "left" : undefined}
                  style={edgePinStyle("left", hasLeftPin, PIN_Z.body)}
                  className={cx(classNames.cell, classNames.selectionCell)}
                >
                  <input
                    type="checkbox"
                    aria-label={labels.selectRow}
                    checked={selection.isSelected(id)}
                    onChange={() => selection.toggle(id)}
                    className={classNames.checkbox}
                  />
                </td>
              )}
              {columns.map((column) => {
                const pinStyle = bodyPinStyle(column.key);
                return (
                  <td
                    key={column.key}
                    {...table.getCellProps(
                      column,
                      pinStyle && { style: pinStyle }
                    )}
                    data-adapttable-part="cell"
                    data-pinned={pinOffset?.(column.key)?.side}
                    className={classNames.cell}
                  >
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </td>
                );
              })}
              {showActions && (
                <td
                  data-adapttable-part="actions-cell"
                  data-pinned={hasRightPin ? "right" : undefined}
                  style={edgePinStyle("right", hasRightPin, PIN_Z.body)}
                  className={cx(classNames.cell, classNames.actionsCell)}
                >
                  <RowActionButtons
                    row={row}
                    actions={rowActions!}
                    confirm={confirm}
                    cancelLabel={labels.cancel}
                    classNames={classNames}
                  />
                </td>
              )}
            </tr>
          );
        })}
        {paddingBottom > 0 && (
          <tr>
            <td
              colSpan={columnSpan}
              style={{ height: paddingBottom, padding: 0 }}
            />
          </tr>
        )}
      </tbody>
    </table>
  );

  // A pinned column needs a horizontal scroll container to stick to, so wrap
  // the table whenever something is pinned (or a `maxHeight` bounds it). We do
  // NOT wrap a plain table — `overflow-x:auto` makes `overflow-y` compute to
  // `auto` too, which would trap a page-scroll sticky header inside the box.
  const hasPinned = columns.some((c) => pinOffset?.(c.key) != null);
  if (maxHeight == null && !hasPinned) return tableEl;
  return (
    <div
      data-adapttable-part="scroll-box"
      style={
        maxHeight == null
          ? { overflowX: "auto" }
          : { maxHeight, overflowX: "auto", overflowY: "auto" }
      }
    >
      {tableEl}
    </div>
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
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  return (
    <ul
      {...table.getTableProps({ role: undefined })}
      data-adapttable-part="cards"
      className={classNames.cards}
      style={{ listStyle: "none", margin: 0, padding: 0 }}
    >
      {paddingTop > 0 && (
        <li
          aria-hidden
          data-adapttable-part="virtual-spacer"
          style={{ height: paddingTop }}
        />
      )}
      {entries.map(({ row, index, key }) => {
        const id = getRowId(row);
        return (
          <li
            key={key}
            {...rowClickProps(row, onRowClick)}
            ref={measureElement}
            data-index={index}
            data-adapttable-part="card"
            data-selected={selection?.isSelected(id) ? "" : undefined}
            data-clickable={onRowClick ? "" : undefined}
            className={cx(classNames.card, rowClassName?.(row, index))}
          >
            {selection && (
              <input
                type="checkbox"
                aria-label={labels.selectRow}
                checked={selection.isSelected(id)}
                onChange={() => selection.toggle(id)}
                className={classNames.checkbox}
              />
            )}
            {columns.map((column) => (
              <div
                key={column.key}
                data-adapttable-part="card-row"
                className={classNames.cardRow}
              >
                <span
                  data-adapttable-part="card-label"
                  className={classNames.cardLabel}
                >
                  {cardLabel(column)}
                </span>
                <span
                  data-adapttable-part="card-value"
                  className={classNames.cardValue}
                >
                  {column.Cell ? (
                    <column.Cell row={row} rowIndex={index} />
                  ) : (
                    column.accessor?.(row)
                  )}
                </span>
              </div>
            ))}
            {rowActions && rowActions.length > 0 && (
              <div
                data-adapttable-part="card-actions"
                className={classNames.actionsCell}
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
          </li>
        );
      })}
      {paddingBottom > 0 && (
        <li
          aria-hidden
          data-adapttable-part="virtual-spacer"
          style={{ height: paddingBottom }}
        />
      )}
    </ul>
  );
}

function sortGlyph(active: boolean, dir: "asc" | "desc" | undefined): string {
  if (!active) return "↕";
  return dir === "asc" ? "↑" : "↓";
}

function cardLabel<TRow>(column: ColumnDef<TRow>): string {
  return (
    column.mobileLabel ??
    (typeof column.header === "string" ? column.header : column.key)
  );
}
