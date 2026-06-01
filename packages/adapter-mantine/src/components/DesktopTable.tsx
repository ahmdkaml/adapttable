import {
  type ColumnDef,
  type ConfirmHandler,
  type RowAction,
  runRowAction,
  type UseDataTableResult,
} from "@adapttable/core";
import { ActionIcon, Checkbox, Group, Table, Tooltip } from "@mantine/core";
import type { RefObject } from "react";

import { ChevronDownIcon, ChevronUpIcon, SelectorIcon } from "../icons";

/** Props for {@link DesktopTable}. */
export interface DesktopTableProps<TRow> {
  table: UseDataTableResult<TRow>;
  rows: readonly TRow[];
  rowActions?: RowAction<TRow>[];
  confirm: ConfirmHandler;
  prefetch?: (row: TRow) => void;
  getRowId: (row: TRow) => string;
  bodyRef: RefObject<HTMLTableSectionElement>;
  className?: string;
}

function SortIcon({
  active,
  dir,
}: Readonly<{
  active: boolean;
  dir: "asc" | "desc" | undefined;
}>) {
  if (!active) return <SelectorIcon size={12} />;
  return dir === "asc" ? (
    <ChevronUpIcon size={12} />
  ) : (
    <ChevronDownIcon size={12} />
  );
}

function HeaderCell<TRow>({
  table,
  column,
}: Readonly<{
  table: UseDataTableResult<TRow>;
  column: ColumnDef<TRow>;
}>) {
  const cellProps = table.getHeaderCellProps(column);
  if (!column.sortable) {
    return <Table.Th {...cellProps}>{column.header}</Table.Th>;
  }
  const active = table.sortBy === column.key;
  const buttonProps = table.getSortButtonProps(column);
  return (
    <Table.Th {...cellProps}>
      <Group
        component="button"
        gap={6}
        wrap="nowrap"
        display="inline-flex"
        style={{
          background: "none",
          border: 0,
          cursor: "pointer",
          font: "inherit",
          padding: 0,
          color: active ? "var(--mantine-primary-color-filled)" : "inherit",
        }}
        {...buttonProps}
      >
        <span>{column.header}</span>
        <SortIcon active={active} dir={table.sortDir} />
      </Group>
    </Table.Th>
  );
}

function RowActions<TRow>({
  row,
  actions,
  confirm,
  cancelLabel,
}: Readonly<{
  row: TRow;
  actions: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
}>) {
  return (
    <Group gap={4} justify="flex-end" wrap="nowrap">
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const disabled = action.isDisabled?.(row) ?? false;
        return (
          <Tooltip
            key={action.key}
            label={action.label}
            withArrow
            openDelay={200}
          >
            <ActionIcon
              variant="subtle"
              color={action.color}
              size="sm"
              disabled={disabled}
              aria-label={action.label}
              onClick={(e) => {
                e.stopPropagation();
                if (!disabled) runRowAction(action, row, confirm, cancelLabel);
              }}
            >
              {action.icon}
            </ActionIcon>
          </Tooltip>
        );
      })}
    </Group>
  );
}

/** Desktop table rendering driven by core prop-getters. */
export function DesktopTable<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  prefetch,
  getRowId,
  bodyRef,
  className,
}: Readonly<DesktopTableProps<TRow>>) {
  const { columns, selection, labels } = table;
  const showActions = (rowActions?.length ?? 0) > 0;

  return (
    <div style={{ overflowX: "auto", width: "100%" }}>
      <Table
        {...table.getTableProps()}
        className={className}
        highlightOnHover
        verticalSpacing="sm"
        horizontalSpacing="md"
        stickyHeader
        miw={480}
      >
        <Table.Thead>
          <Table.Tr {...table.getHeaderRowProps()}>
            {selection && (
              <Table.Th w={40} ta="center">
                <Checkbox
                  aria-label={labels.selectAll}
                  checked={selection.headerState === "all"}
                  indeterminate={selection.headerState === "some"}
                  onChange={selection.toggleAll}
                />
              </Table.Th>
            )}
            {columns.map((column) => (
              <HeaderCell key={column.key} table={table} column={column} />
            ))}
            {showActions && (
              <Table.Th ta="end" w={120}>
                {labels.actions}
              </Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody ref={bodyRef}>
          {rows.map((row, index) => {
            const id = getRowId(row);
            // `key` is handled explicitly — spreading it would warn.
            const { key, ...rowProps } = table.getRowProps(row, index);
            return (
              <Table.Tr
                key={key as string}
                {...rowProps}
                data-stagger=""
                onMouseEnter={prefetch ? () => prefetch(row) : undefined}
              >
                {selection && (
                  <Table.Td ta="center">
                    <Checkbox
                      aria-label={labels.selectRow}
                      checked={selection.isSelected(id)}
                      onChange={() => selection.toggle(id)}
                    />
                  </Table.Td>
                )}
                {columns.map((column) => (
                  <Table.Td key={column.key} {...table.getCellProps(column)}>
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </Table.Td>
                ))}
                {showActions && (
                  <Table.Td ta="end">
                    <RowActions
                      row={row}
                      actions={rowActions!}
                      confirm={confirm}
                      cancelLabel={labels.cancel}
                    />
                  </Table.Td>
                )}
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </div>
  );
}
