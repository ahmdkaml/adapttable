import {
  type ColumnDef,
  type ConfirmHandler,
  resolveDisabledReason,
  type RowAction,
  runRowAction,
  type UseDataTableResult,
  type VirtualTableRow,
} from "@adapttable/core";
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Table,
  Tooltip,
} from "@mantine/core";
import type { CSSProperties, MouseEvent, RefObject } from "react";

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
  rowEntries?: readonly VirtualTableRow<TRow>[];
  paddingTop?: number;
  paddingBottom?: number;
  measureElement?: (element: Element | null) => void;
  stickyHeaderOffset?: number;
  stickyHeader?: boolean;
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
  stickyStyle,
}: Readonly<{
  table: UseDataTableResult<TRow>;
  column: ColumnDef<TRow>;
  stickyStyle: CSSProperties;
}>) {
  const cellProps = table.getHeaderCellProps(column);
  const headerStyle = {
    ...(cellProps.style as CSSProperties | undefined),
    ...stickyStyle,
  };
  if (!column.sortable) {
    return (
      <Table.Th {...cellProps} style={headerStyle}>
        {column.header}
      </Table.Th>
    );
  }
  const active = table.sortBy === column.key;
  const buttonProps = table.getSortButtonProps(column);
  return (
    <Table.Th {...cellProps} style={headerStyle}>
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
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        const handleClick = (e: MouseEvent) => {
          e.stopPropagation();
          if (!disabled) runRowAction(action, row, confirm, cancelLabel);
        };
        // Icon-only actions render as an ActionIcon; without an icon, fall
        // back to a text button so the label is actually visible.
        return action.icon ? (
          <Tooltip
            key={action.key}
            label={reason ?? action.label}
            withArrow
            openDelay={200}
          >
            <ActionIcon
              variant="subtle"
              color={action.color}
              size="sm"
              disabled={disabled}
              aria-label={action.label}
              onClick={handleClick}
            >
              {action.icon}
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            key={action.key}
            variant="subtle"
            color={action.color}
            size="compact-sm"
            disabled={disabled}
            onClick={handleClick}
          >
            {action.label}
          </Button>
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
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
  stickyHeaderOffset = 0,
  stickyHeader = true,
}: Readonly<DesktopTableProps<TRow>>) {
  const { columns, selection, labels } = table;
  const showActions = (rowActions?.length ?? 0) > 0;
  const entries =
    rowEntries ??
    rows.map((row, index) => ({
      row,
      index,
      key: table.getRowProps(row, index).key as string,
    }));
  const columnSpan =
    columns.length + (selection ? 1 : 0) + (showActions ? 1 : 0);
  // `position: sticky` on `<thead>` does not engage against the document
  // scroller (only inside an overflow container) — so we stick the header
  // *cells* instead, which pins reliably at the page level beneath the
  // sticky toolbar (`stickyHeaderOffset`). Each th carries its own opaque
  // background so scrolled rows never show through.
  const headerCellStyle: CSSProperties = stickyHeader
    ? {
        position: "sticky",
        top: stickyHeaderOffset,
        zIndex: 2,
        background: "var(--mantine-color-body)",
        boxShadow: "0 1px 0 var(--mantine-color-default-border)",
      }
    : { background: "var(--mantine-color-body)" };

  return (
    <div style={{ width: "100%" }}>
      <Table
        {...table.getTableProps()}
        className={className}
        highlightOnHover
        verticalSpacing="sm"
        horizontalSpacing="md"
        miw={480}
      >
        <Table.Thead style={{ background: "var(--mantine-color-body)" }}>
          <Table.Tr {...table.getHeaderRowProps()}>
            {selection && (
              <Table.Th w={40} ta="center" style={headerCellStyle}>
                <Checkbox
                  aria-label={labels.selectAll}
                  checked={selection.headerState === "all"}
                  indeterminate={selection.headerState === "some"}
                  onChange={selection.toggleAll}
                />
              </Table.Th>
            )}
            {columns.map((column) => (
              <HeaderCell
                key={column.key}
                table={table}
                column={column}
                stickyStyle={headerCellStyle}
              />
            ))}
            {showActions && (
              <Table.Th ta="end" w={120} style={headerCellStyle}>
                {labels.actions}
              </Table.Th>
            )}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody ref={bodyRef}>
          {paddingTop > 0 && (
            <Table.Tr aria-hidden>
              <Table.Td
                colSpan={columnSpan}
                style={{ height: paddingTop, padding: 0 }}
              />
            </Table.Tr>
          )}
          {entries.map(({ row, index, key }) => {
            const id = getRowId(row);
            const rowProps = { ...table.getRowProps(row, index) };
            // React handles `key` explicitly below; spreading it would warn.
            delete rowProps.key;
            return (
              <Table.Tr
                key={key}
                {...rowProps}
                ref={measureElement}
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
          {paddingBottom > 0 && (
            <Table.Tr aria-hidden>
              <Table.Td
                colSpan={columnSpan}
                style={{ height: paddingBottom, padding: 0 }}
              />
            </Table.Tr>
          )}
        </Table.Tbody>
      </Table>
    </div>
  );
}
