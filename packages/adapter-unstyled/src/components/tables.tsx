import {
  type ColumnDef,
  type ConfirmHandler,
  pinnedCellStyle,
  resolveDisabledReason,
  resolveVirtualRows,
  type RowAction,
  runRowAction,
  type UseDataTableResult,
  virtualColumnSpan,
  type VirtualTableRow,
} from "@adapttable/core";
import type { CSSProperties } from "react";

import { cx } from "../cx";
import type { DataTableClassNames } from "../types";

interface SharedProps<TRow> {
  table: UseDataTableResult<TRow>;
  rows: readonly TRow[];
  rowActions?: RowAction<TRow>[];
  confirm: ConfirmHandler;
  getRowId: (row: TRow) => string;
  classNames: DataTableClassNames;
  /** Hover-prefetch callback fired on desktop row mouse-enter. */
  prefetch?: (row: TRow) => void;
  rowEntries?: readonly VirtualTableRow<TRow>[];
  paddingTop?: number;
  paddingBottom?: number;
  measureElement?: (element: Element | null) => void;
  stickyHeader?: boolean;
  stickyTop?: number;
  pinOffset?: (
    key: string
  ) => { side: "left" | "right"; inset: number } | undefined;
  maxHeight?: number;
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
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) runRowAction(action, row, confirm, cancelLabel);
            }}
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
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
  stickyHeader = false,
  stickyTop = 0,
  pinOffset,
  maxHeight,
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const showActions = (rowActions?.length ?? 0) > 0;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  const columnSpan = virtualColumnSpan(
    columns.length,
    Boolean(selection),
    showActions
  );
  // Stick the header *cells* (a `<thead>` does not pin against the document
  // scroller). The adapter ships no colours, so consumers must give their
  // `headerCell` class an opaque background — the `data-sticky`/`data-pinned`
  // hooks make that easy to target.
  const stickyStyle: CSSProperties | undefined = stickyHeader
    ? { position: "sticky", top: stickyTop, zIndex: 1 }
    : undefined;
  const stickyAttr = stickyHeader || undefined;
  // Pinned header cells need both the sticky-top and sticky-left/right styles.
  const pinStyle = (key: string): CSSProperties | undefined =>
    pinnedCellStyle(pinOffset?.(key), 2);
  const headStyle = (key: string): CSSProperties | undefined => {
    const pin = pinStyle(key);
    if (!stickyStyle && !pin) return undefined;
    return { ...stickyStyle, ...pin };
  };

  const tableEl = (
    <table
      {...table.getTableProps()}
      data-adapttable-part="table"
      className={classNames.table}
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
              style={stickyStyle}
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
            const headerProps = table.getHeaderCellProps(column);
            const active = table.sortBy === column.key;
            return (
              <th
                key={column.key}
                {...headerProps}
                data-adapttable-part="header-cell"
                data-sorted={active ? table.sortDir : undefined}
                data-sticky={stickyAttr}
                data-pinned={pinOffset?.(column.key)?.side}
                style={headStyle(column.key)}
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
              </th>
            );
          })}
          {showActions && (
            <th
              data-adapttable-part="actions-header"
              data-sticky={stickyAttr}
              style={stickyStyle}
              className={classNames.headerCell}
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
              ref={measureElement}
              data-adapttable-part="row"
              data-selected={selection?.isSelected(id) ? "" : undefined}
              className={classNames.row}
              onMouseEnter={prefetch ? () => prefetch(row) : undefined}
            >
              {selection && (
                <td
                  data-adapttable-part="selection-cell"
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
              {columns.map((column) => (
                <td
                  key={column.key}
                  {...table.getCellProps(column)}
                  data-adapttable-part="cell"
                  data-pinned={pinOffset?.(column.key)?.side}
                  style={pinStyle(column.key)}
                  className={classNames.cell}
                >
                  {column.Cell ? (
                    <column.Cell row={row} rowIndex={index} />
                  ) : (
                    column.accessor?.(row)
                  )}
                </td>
              ))}
              {showActions && (
                <td
                  data-adapttable-part="actions-cell"
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

  // A bounded-height scroll box turns on sideways scrolling so pinned columns
  // (sticky left/right) have somewhere to stick; the header pins to the box.
  return maxHeight == null ? (
    tableEl
  ) : (
    <div
      data-adapttable-part="scroll-box"
      style={{ maxHeight, overflow: "auto" }}
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
            ref={measureElement}
            data-index={index}
            data-adapttable-part="card"
            data-selected={selection?.isSelected(id) ? "" : undefined}
            className={classNames.card}
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
