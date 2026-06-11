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
  virtualColumnSpan,
} from "@adapttable/core";
import {
  Box,
  Button,
  Card,
  CardBody,
  Checkbox,
  HStack,
  IconButton,
  Stack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from "@chakra-ui/react";
import type { CSSProperties } from "react";

import { subtleText } from "../styles";

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

interface SharedProps<TRow> extends SharedTableRenderProps<TRow> {
  /** Class hook for the table (desktop) / each card (mobile). */
  className?: string;
  size: "sm" | "md" | "lg";
  colorScheme?: string;
}

/** Join the static class hook with a conditional per-row class. */
function joinClasses(
  base: string | undefined,
  extra: string | undefined
): string | undefined {
  if (base && extra) return `${base} ${extra}`;
  return base ?? extra;
}

function chakraAlign(
  align: ColumnDef<unknown>["align"]
): "start" | "center" | "end" {
  if (align === "center") return "center";
  if (align === "end") return "end";
  return "start";
}

function sortGlyph(active: boolean, dir: "asc" | "desc" | undefined): string {
  if (!active) return " ↕";
  return dir === "asc" ? " ↑" : " ↓";
}

function RowActionButtons<TRow>({
  row,
  actions,
  confirm,
  cancelLabel,
  colorScheme,
}: Readonly<{
  row: TRow;
  actions: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
  colorScheme?: string;
}>) {
  return (
    <HStack spacing={1} justify="flex-end">
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        // The disabled attribute already blocks activation, so attach the
        // handler only when the action can run.
        const handleClick = disabled
          ? undefined
          : (e: React.MouseEvent) => {
              e.stopPropagation();
              runRowAction(action, row, confirm, cancelLabel);
            };
        // Icon-only actions use IconButton (with a tooltip for the name);
        // text actions use a real Button so the label actually renders
        // (IconButton ignores children).
        return action.icon ? (
          <Tooltip key={action.key} label={reason ?? action.label}>
            <IconButton
              size="sm"
              variant="ghost"
              colorScheme={action.color ?? colorScheme}
              isDisabled={disabled}
              aria-label={action.label}
              icon={action.icon as React.ReactElement}
              onClick={handleClick}
            />
          </Tooltip>
        ) : (
          <Tooltip key={action.key} label={reason ?? action.label}>
            <Button
              size="sm"
              variant="ghost"
              colorScheme={action.color ?? colorScheme}
              isDisabled={disabled}
              onClick={handleClick}
            >
              {action.label}
            </Button>
          </Tooltip>
        );
      })}
    </HStack>
  );
}

/** Desktop Chakra table. */
export function DesktopTable<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  size,
  colorScheme,
  prefetch,
  onRowClick,
  rowClassName,
  className,
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
  const { columns, selection, labels } = table;
  const showActions = (rowActions?.length ?? 0) > 0;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  const columnSpan = virtualColumnSpan(
    columns.length,
    Boolean(selection),
    showActions
  );
  // Stick the header *cells* (a `<thead>` does not pin against the document
  // scroller) and avoid `<TableContainer>`, whose `overflow-x` would trap
  // sticky and let the header overlap the first row.
  // Inside a maxHeight scroll box the box itself is the sticky context, so
  // the header pins to ITS top — a viewport offset would float it mid-box.
  const stickyTh = stickyHeader
    ? {
        position: "sticky" as const,
        top: maxHeight == null ? `${stickyTop}px` : "0px",
        zIndex: PIN_Z.header,
        bg: "chakra-body-bg",
      }
    : {};
  // The leading checkbox (48px) and trailing actions (120px) columns pin to the
  // edge alongside the data columns, which therefore start past them.
  const selectionWidth = 48;
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
  const pinBg = "var(--chakra-colors-chakra-body-bg)";
  // Pinned cells use a raw `style` (Chakra maps numeric props onto its spacing
  // scale, which would mangle pixel insets) plus an opaque background.
  const pinStyle = (key: string, z: number): CSSProperties | undefined => {
    const pin = pinnedCellStyle(pinOffset?.(key), z, leads);
    return pin ? { ...pin, background: pinBg } : undefined;
  };
  // Edge (selection / actions) cell sticks flush to its side when a data column
  // on that side is pinned.
  const edgeStyle = (
    side: "left" | "right",
    active: boolean,
    z: number
  ): CSSProperties | undefined => {
    const pin = edgePinStyle(side, active, z);
    return pin ? { ...pin, background: pinBg } : undefined;
  };
  // Header-cell style merging pin + user width; the resize handle is absolute,
  // so add a positioning context when the cell is not already sticky/pinned.
  const headCellStyle = (
    column: ColumnDef<TRow>
  ): CSSProperties | undefined => {
    const key = column.key;
    const pin = pinStyle(key, PIN_Z.headerPinned);
    // A pinned column renders at the width its sticky inset assumed, so
    // stacked pins stay flush even with no declared width.
    const width = pin
      ? pinnedColumnWidth(column, columnWidths)
      : columnWidths?.[key];
    if (!pin && width == null && !setWidth) return undefined;
    const style: CSSProperties = { ...pin };
    if (width != null) style.width = width;
    if (setWidth && !stickyHeader && !pin) style.position = "relative";
    return style;
  };
  const columnName = (column: ColumnDef<TRow>): string =>
    typeof column.header === "string" ? column.header : column.key;

  const hasPinned = table.columns.some((c) => pinOffset?.(c.key) != null);
  // Fixed-width columns get a real table min-width (their sum), so the table
  // overflows and scrolls horizontally instead of squishing columns to fit.
  const minWidth = tableMinWidth(columns, {
    widths: columnWidths,
    extra: (selection ? selectionWidth : 0) + (showActions ? actionsWidth : 0),
  });

  return (
    <Box
      maxH={maxHeight == null ? undefined : `${maxHeight}px`}
      overflowX={maxHeight != null || hasPinned ? "auto" : undefined}
      overflowY={maxHeight == null ? undefined : "auto"}
    >
      <Table
        size={size}
        data-size={size}
        className={className}
        minW={minWidth > 0 ? `${minWidth}px` : undefined}
        aria-label={table.getTableProps()["aria-label"] as string}
      >
        <Thead>
          <Tr>
            {selection && (
              <Th
                {...stickyTh}
                style={edgeStyle("left", hasLeftPin, PIN_Z.headerPinned)}
              >
                <Checkbox
                  aria-label={labels.selectAll}
                  isChecked={selection.headerState === "all"}
                  isIndeterminate={selection.headerState === "some"}
                  onChange={selection.toggleAll}
                />
              </Th>
            )}
            {columns.map((column) => {
              const active = table.sortBy === column.key;
              const ariaSort = table.getHeaderCellProps(column)["aria-sort"] as
                | "ascending"
                | "descending"
                | "none"
                | undefined;
              return (
                <Th
                  key={column.key}
                  textAlign={chakraAlign(column.align)}
                  width={column.width}
                  aria-sort={ariaSort}
                  {...stickyTh}
                  style={headCellStyle(column)}
                >
                  {column.sortable ? (
                    <Box
                      as="button"
                      type="button"
                      cursor="pointer"
                      aria-label={`${labels.sortBy}: ${columnName(column)}`}
                      onClick={() => table.toggleSort(column.key)}
                    >
                      {column.header}
                      <Text as="span" aria-hidden>
                        {sortGlyph(active, table.sortDir)}
                      </Text>
                    </Box>
                  ) : (
                    column.header
                  )}
                  {setWidth && (
                    <Box
                      as="span"
                      style={RESIZE_HANDLE_STYLE}
                      {...columnResizeHandleProps(
                        column.key,
                        setWidth,
                        `${resizeLabel}: ${columnName(column)}`
                      )}
                    />
                  )}
                </Th>
              );
            })}
            {showActions && (
              <Th
                textAlign="end"
                {...stickyTh}
                style={edgeStyle("right", hasRightPin, PIN_Z.headerPinned)}
              >
                {labels.actions}
              </Th>
            )}
          </Tr>
        </Thead>
        <Tbody>
          {paddingTop > 0 && (
            <Tr aria-hidden>
              <Td colSpan={columnSpan} h={`${paddingTop}px`} p={0} />
            </Tr>
          )}
          {entries.map(({ row, index, key }) => {
            const id = getRowId(row);
            const selected = selection?.isSelected(id);
            return (
              <Tr
                key={key}
                {...rowClickProps(row, onRowClick)}
                ref={measureElement}
                data-index={index}
                className={rowClassName?.(row, index)}
                bg={selected ? "blackAlpha.100" : undefined}
                _dark={{ bg: selected ? "whiteAlpha.200" : undefined }}
                onMouseEnter={prefetch ? () => prefetch(row) : undefined}
              >
                {selection && (
                  <Td style={edgeStyle("left", hasLeftPin, PIN_Z.body)}>
                    <Checkbox
                      aria-label={labels.selectRow}
                      isChecked={selection.isSelected(id)}
                      onChange={() => selection.toggle(id)}
                    />
                  </Td>
                )}
                {columns.map((column) => (
                  <Td
                    key={column.key}
                    textAlign={chakraAlign(column.align)}
                    style={pinStyle(column.key, 1)}
                  >
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </Td>
                ))}
                {showActions && (
                  <Td
                    textAlign="end"
                    style={edgeStyle("right", hasRightPin, PIN_Z.body)}
                  >
                    <RowActionButtons
                      row={row}
                      actions={rowActions!}
                      confirm={confirm}
                      cancelLabel={labels.cancel}
                      colorScheme={colorScheme}
                    />
                  </Td>
                )}
              </Tr>
            );
          })}
          {paddingBottom > 0 && (
            <Tr aria-hidden>
              <Td colSpan={columnSpan} h={`${paddingBottom}px`} p={0} />
            </Tr>
          )}
        </Tbody>
      </Table>
    </Box>
  );
}

function mobileLabel<TRow>(column: ColumnDef<TRow>): string {
  return (
    column.mobileLabel ??
    (typeof column.header === "string" ? column.header : column.key)
  );
}

/** Mobile Chakra card list. */
export function MobileCards<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  size,
  colorScheme,
  onRowClick,
  rowClassName,
  className,
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  const compact = size === "sm";
  return (
    <Stack
      spacing={compact ? 2 : 3}
      role="list"
      aria-label={table.getTableProps()["aria-label"] as string}
    >
      {paddingTop > 0 && <Box aria-hidden h={`${paddingTop}px`} />}
      {entries.map(({ row, index, key }) => {
        const id = getRowId(row);
        return (
          <Card
            key={key}
            ref={measureElement}
            data-index={index}
            variant="outline"
            role="listitem"
            className={joinClasses(className, rowClassName?.(row, index))}
            {...rowClickProps(row, onRowClick)}
          >
            <CardBody p={compact ? 3 : undefined}>
              {selection && (
                <Checkbox
                  aria-label={labels.selectRow}
                  isChecked={selection.isSelected(id)}
                  onChange={() => selection.toggle(id)}
                  mb={2}
                />
              )}
              {columns.map((column) => (
                <Box key={column.key} mb={compact ? 1 : 2}>
                  <Text fontSize="xs" {...subtleText} textTransform="uppercase">
                    {mobileLabel(column)}
                  </Text>
                  <Text fontSize="sm">
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </Text>
                </Box>
              ))}
              {rowActions && rowActions.length > 0 && (
                <RowActionButtons
                  row={row}
                  actions={rowActions}
                  confirm={confirm}
                  cancelLabel={labels.cancel}
                  colorScheme={colorScheme}
                />
              )}
            </CardBody>
          </Card>
        );
      })}
      {paddingBottom > 0 && <Box aria-hidden h={`${paddingBottom}px`} />}
    </Stack>
  );
}
