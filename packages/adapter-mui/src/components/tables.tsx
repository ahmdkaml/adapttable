import {
  type ColumnDef,
  columnResizeHandleProps,
  type ConfirmHandler,
  pinnedCellStyle,
  resolveDisabledReason,
  resolveVirtualRows,
  type RowAction,
  runRowAction,
  type SharedTableRenderProps,
  virtualColumnSpan,
} from "@adapttable/core";

/** Sx for an absolutely-positioned column-resize handle. */
const RESIZE_HANDLE_SX = {
  position: "absolute",
  insetInlineEnd: 0,
  top: 0,
  height: "100%",
  width: 8,
  cursor: "col-resize",
  touchAction: "none",
  userSelect: "none",
} as const;
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  IconButton,
  Stack,
  type SxProps,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  type Theme,
  Tooltip,
  Typography,
} from "@mui/material";

/** Map a destructive colour token to MUI's `"error"` palette, else default. */
function muiColor(color: string | undefined): "default" | "error" {
  return color === "danger" || color === "red" || color === "error"
    ? "error"
    : "default";
}

interface SharedProps<TRow> extends SharedTableRenderProps<TRow> {
  size: "small" | "medium";
}

/**
 * Logical (RTL-aware) `text-align` for a column. Applied via `sx` rather
 * than MUI's physical `align` prop so `"end"` follows the writing direction
 * (right in LTR, left in RTL).
 */
function muiAlign(
  align: ColumnDef<unknown>["align"]
): "start" | "center" | "end" {
  if (align === "center") return "center";
  if (align === "end") return "end";
  return "start";
}

function RowActionButtons<TRow>({
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
    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        return (
          <Tooltip key={action.key} title={reason ?? action.label}>
            <span>
              <IconButton
                size="small"
                color={muiColor(action.color)}
                disabled={disabled}
                aria-label={action.label}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!disabled)
                    runRowAction(action, row, confirm, cancelLabel);
                }}
              >
                {action.icon ?? (
                  <Typography variant="caption">{action.label}</Typography>
                )}
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}

/** Desktop MUI table. */
export function DesktopTable<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  size,
  prefetch,
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
  // `position: sticky` on a `<thead>` does not pin against the document
  // scroller, so we stick the header *cells* instead. Pinned cells also stick
  // left/right (corner-sticky in the header) with an opaque background.
  const headSx = stickyHeader
    ? {
        position: "sticky" as const,
        top: stickyTop,
        zIndex: 2,
        bgcolor: "background.paper",
      }
    : undefined;
  // Built with conditional spreads so no key is ever `undefined` — that keeps
  // the object assignable to MUI's strict `sx` index signature with no cast.
  const headCellSx = (column: ColumnDef<TRow>) => {
    const pin = pinnedCellStyle(pinOffset?.(column.key), 2);
    const width = columnWidths?.[column.key] ?? column.width;
    // The resize handle is absolute; an un-pinned/un-sticky cell still needs a
    // positioning context for it.
    const needsRelative = Boolean(setWidth) && !headSx && !pin;
    return {
      ...headSx,
      ...(pin && { ...pin, bgcolor: "background.paper" }),
      ...(needsRelative && { position: "relative" as const }),
      textAlign: muiAlign(column.align),
      ...(width != null && { width }),
    };
  };
  const bodyPinSx = (key: string) => {
    const pin = pinnedCellStyle(pinOffset?.(key), 1);
    return pin ? { ...pin, bgcolor: "background.paper" } : undefined;
  };

  const hasPinned = table.columns.some((c) => pinOffset?.(c.key) != null);
  let boxSx: SxProps<Theme> | undefined;
  if (maxHeight != null) {
    boxSx = { maxHeight, overflow: "auto" };
  } else if (hasPinned) {
    boxSx = { overflowX: "auto" };
  }

  return (
    <Box sx={boxSx}>
      <Table
        size={size}
        aria-label={table.getTableProps()["aria-label"] as string}
      >
        <TableHead>
          <TableRow>
            {selection && (
              <TableCell padding="checkbox" sx={headSx}>
                <Checkbox
                  slotProps={{ input: { "aria-label": labels.selectAll } }}
                  checked={selection.headerState === "all"}
                  indeterminate={selection.headerState === "some"}
                  onChange={selection.toggleAll}
                />
              </TableCell>
            )}
            {columns.map((column) => {
              const active = table.sortBy === column.key;
              // Core reports aria-sort="none" for sortable-but-inactive
              // columns so screen readers announce them as sortable.
              const ariaSort = table.getHeaderCellProps(column)["aria-sort"] as
                | "ascending"
                | "descending"
                | "none"
                | undefined;
              return (
                <TableCell
                  key={column.key}
                  aria-sort={ariaSort}
                  sx={headCellSx(column)}
                >
                  {column.sortable ? (
                    <TableSortLabel
                      active={active}
                      direction={active ? table.sortDir : "asc"}
                      onClick={() => table.toggleSort(column.key)}
                    >
                      {column.header}
                    </TableSortLabel>
                  ) : (
                    column.header
                  )}
                  {setWidth && (
                    <Box
                      component="span"
                      sx={RESIZE_HANDLE_SX}
                      {...columnResizeHandleProps(
                        column.key,
                        setWidth,
                        `${resizeLabel}: ${
                          typeof column.header === "string"
                            ? column.header
                            : column.key
                        }`
                      )}
                    />
                  )}
                </TableCell>
              );
            })}
            {showActions && (
              <TableCell sx={{ ...headSx, textAlign: "end" }}>
                {labels.actions}
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {paddingTop > 0 && (
            <TableRow aria-hidden>
              <TableCell
                colSpan={columnSpan}
                sx={{ height: paddingTop, p: 0 }}
              />
            </TableRow>
          )}
          {entries.map(({ row, index, key }) => {
            const id = getRowId(row);
            const selected = selection?.isSelected(id) ?? false;
            return (
              <TableRow
                key={key}
                ref={measureElement}
                data-index={index}
                hover
                selected={selected}
                onMouseEnter={prefetch ? () => prefetch(row) : undefined}
              >
                {selection && (
                  <TableCell padding="checkbox">
                    <Checkbox
                      slotProps={{ input: { "aria-label": labels.selectRow } }}
                      checked={selected}
                      onChange={() => selection.toggle(id)}
                    />
                  </TableCell>
                )}
                {columns.map((column) => (
                  <TableCell
                    key={column.key}
                    sx={{
                      ...bodyPinSx(column.key),
                      textAlign: muiAlign(column.align),
                    }}
                  >
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell sx={{ textAlign: "end" }}>
                    <RowActionButtons
                      row={row}
                      actions={rowActions!}
                      confirm={confirm}
                      cancelLabel={labels.cancel}
                    />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
          {paddingBottom > 0 && (
            <TableRow aria-hidden>
              <TableCell
                colSpan={columnSpan}
                sx={{ height: paddingBottom, p: 0 }}
              />
            </TableRow>
          )}
        </TableBody>
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

/** Mobile MUI card list. */
export function MobileCards<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const entries = resolveVirtualRows(rows, getRowId, rowEntries);
  return (
    <Stack spacing={1.5} role="list">
      {paddingTop > 0 && <Box aria-hidden sx={{ height: paddingTop }} />}
      {entries.map(({ row, index, key }) => {
        const id = getRowId(row);
        return (
          <Card
            key={key}
            ref={measureElement}
            data-index={index}
            variant="outlined"
            role="listitem"
          >
            <CardContent>
              {selection && (
                <Checkbox
                  slotProps={{ input: { "aria-label": labels.selectRow } }}
                  checked={selection.isSelected(id)}
                  onChange={() => selection.toggle(id)}
                />
              )}
              {columns.map((column) => (
                <Box key={column.key} sx={{ mb: 1 }}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                  >
                    {mobileLabel(column)}
                  </Typography>
                  <Typography variant="body2">
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </Typography>
                </Box>
              ))}
              {rowActions && rowActions.length > 0 && (
                <RowActionButtons
                  row={row}
                  actions={rowActions}
                  confirm={confirm}
                  cancelLabel={labels.cancel}
                />
              )}
            </CardContent>
          </Card>
        );
      })}
      {paddingBottom > 0 && <Box aria-hidden sx={{ height: paddingBottom }} />}
    </Stack>
  );
}
