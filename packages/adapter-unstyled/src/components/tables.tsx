import {
  type ColumnDef,
  type ConfirmHandler,
  resolveDisabledReason,
  resolveVirtualRows,
  type RowAction,
  runRowAction,
  type UseDataTableResult,
  virtualColumnSpan,
  type VirtualTableRow,
} from "@adapttable/core";

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
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const showActions = (rowActions?.length ?? 0) > 0;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  const columnSpan = virtualColumnSpan(
    columns.length,
    Boolean(selection),
    showActions
  );

  return (
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
