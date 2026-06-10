import {
  type ColumnDef,
  columnResizeHandleProps,
  type ConfirmHandler,
  edgePinStyle,
  PIN_Z,
  type PinLeads,
  pinnedCellStyle,
  resolveDisabledReason,
  type RowAction,
  runRowAction,
  tableMinWidth,
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
import type { CSSProperties, MouseEvent, ReactNode, RefObject } from "react";

import { type Density, DENSITY_SPACING } from "../density";

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
  pinOffset?: (
    key: string
  ) => { side: "left" | "right"; inset: number } | undefined;
  maxHeight?: number;
  setWidth?: (key: string, width: number) => void;
  columnWidths?: Readonly<Record<string, number>>;
  resizeLabel?: string;
  density?: Density;
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
  resizeHandle,
}: Readonly<{
  table: UseDataTableResult<TRow>;
  column: ColumnDef<TRow>;
  stickyStyle: CSSProperties;
  resizeHandle?: ReactNode;
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
        {resizeHandle}
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
      {resizeHandle}
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
  stickyHeader = false,
  pinOffset,
  maxHeight,
  setWidth,
  columnWidths,
  resizeLabel = "Resize column",
  density = "comfortable",
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
  const hasPinned = table.columns.some((c) => pinOffset?.(c.key) != null);
  // Pinning needs horizontal scroll, and a `maxHeight` needs vertical scroll;
  // either makes the wrapper a scroll container (setting one overflow axis to
  // `auto` computes the other to `auto` too). Inside that container the page
  // toolbar is irrelevant, so the sticky header sticks to the box top (0).
  // Only against the document scroller must it clear the toolbar via
  // `stickyHeaderOffset`.
  const inScrollBox = maxHeight != null || hasPinned;
  // `position: sticky` on `<thead>` does not engage against the document
  // scroller (only inside an overflow container) — so we stick the header
  // *cells* instead. Each th carries its own opaque background so scrolled
  // rows never show through.
  const headerCellStyle: CSSProperties = stickyHeader
    ? {
        position: "sticky",
        top: inScrollBox ? 0 : stickyHeaderOffset,
        zIndex: PIN_Z.header,
        background: "var(--mantine-color-body)",
        boxShadow: "0 1px 0 var(--mantine-color-default-border)",
      }
    : { background: "var(--mantine-color-body)" };

  // The leading checkbox (40px) and trailing actions (120px) columns pin to
  // the edge alongside the data columns, which therefore start past them.
  const selectionWidth = 40;
  const actionsWidth = 120;
  const leads: PinLeads = {
    left: selection ? selectionWidth : 0,
    right: showActions ? actionsWidth : 0,
  };
  const hasLeftPin = table.columns.some(
    (c) => pinOffset?.(c.key)?.side === "left"
  );
  const hasRightPin = table.columns.some(
    (c) => pinOffset?.(c.key)?.side === "right"
  );

  // Pinned cells stick to the left/right edge (corner-sticky in the header,
  // which also sticks to the top). They need an opaque background.
  const pinBg = "var(--mantine-color-body)";
  const headerStyleFor = (key: string): CSSProperties => {
    const merged: CSSProperties = {
      ...headerCellStyle,
      ...pinnedCellStyle(pinOffset?.(key), PIN_Z.headerPinned, leads),
      width: columnWidths?.[key],
    };
    if (setWidth && !merged.position) merged.position = "relative";
    return merged;
  };
  // The checkbox / actions header cells become corner-sticky (top + edge) when
  // a data column on their side is pinned.
  const selectionHeaderStyle: CSSProperties = {
    ...headerCellStyle,
    ...edgePinStyle("left", hasLeftPin, PIN_Z.headerPinned),
  };
  const actionsHeaderStyle: CSSProperties = {
    ...headerCellStyle,
    ...edgePinStyle("right", hasRightPin, PIN_Z.headerPinned),
  };
  const edgeBodyStyle = (
    side: "left" | "right",
    active: boolean
  ): CSSProperties | undefined => {
    const pin = edgePinStyle(side, active, PIN_Z.body);
    return pin ? { ...pin, background: pinBg } : undefined;
  };
  const columnName = (column: ColumnDef<TRow>): string =>
    typeof column.header === "string" ? column.header : column.key;
  const resizeHandleFor = (column: ColumnDef<TRow>): ReactNode =>
    setWidth ? (
      <span
        {...columnResizeHandleProps(
          column.key,
          setWidth,
          `${resizeLabel}: ${columnName(column)}`
        )}
        style={RESIZE_HANDLE_STYLE}
      />
    ) : undefined;
  const bodyPinStyle = (key: string): CSSProperties | undefined => {
    const pin = pinnedCellStyle(pinOffset?.(key), PIN_Z.body, leads);
    return pin ? { ...pin, background: pinBg } : undefined;
  };

  const { verticalSpacing, horizontalSpacing } = DENSITY_SPACING[density];

  // Fixed-width columns get a real table min-width (their sum), so the table
  // overflows and scrolls horizontally instead of squishing columns to fit.
  const minWidth = tableMinWidth(columns, {
    widths: columnWidths,
    extra: (selection ? 40 : 0) + (showActions ? 120 : 0),
  });
  const wrapperStyle: CSSProperties =
    maxHeight == null
      ? { width: "100%", ...(hasPinned ? { overflowX: "auto" } : {}) }
      : { width: "100%", maxHeight, overflow: "auto" };

  return (
    <div style={wrapperStyle}>
      <Table
        {...table.getTableProps()}
        className={className}
        highlightOnHover
        verticalSpacing={verticalSpacing}
        horizontalSpacing={horizontalSpacing}
        miw={Math.max(480, minWidth)}
      >
        <Table.Thead style={{ background: "var(--mantine-color-body)" }}>
          <Table.Tr {...table.getHeaderRowProps()}>
            {selection && (
              <Table.Th
                w={selectionWidth}
                ta="center"
                style={selectionHeaderStyle}
              >
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
                stickyStyle={headerStyleFor(column.key)}
                resizeHandle={resizeHandleFor(column)}
              />
            ))}
            {showActions && (
              <Table.Th ta="end" w={actionsWidth} style={actionsHeaderStyle}>
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
                  <Table.Td
                    ta="center"
                    style={edgeBodyStyle("left", hasLeftPin)}
                  >
                    <Checkbox
                      aria-label={labels.selectRow}
                      checked={selection.isSelected(id)}
                      onChange={() => selection.toggle(id)}
                    />
                  </Table.Td>
                )}
                {columns.map((column) => (
                  <Table.Td
                    key={column.key}
                    {...table.getCellProps(column)}
                    style={bodyPinStyle(column.key)}
                  >
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </Table.Td>
                ))}
                {showActions && (
                  <Table.Td
                    ta="end"
                    style={edgeBodyStyle("right", hasRightPin)}
                  >
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
