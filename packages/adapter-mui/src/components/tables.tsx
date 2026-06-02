import {
  type ColumnDef,
  type ConfirmHandler,
  type RowAction,
  runRowAction,
  type UseDataTableResult,
} from "@adapttable/core";
import {
  Box,
  Card,
  CardContent,
  Checkbox,
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Tooltip,
  Typography,
} from "@mui/material";

interface SharedProps<TRow> {
  table: UseDataTableResult<TRow>;
  rows: readonly TRow[];
  rowActions?: RowAction<TRow>[];
  confirm: ConfirmHandler;
  getRowId: (row: TRow) => string;
  size: "small" | "medium";
  prefetch?: (row: TRow) => void;
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
        const disabled = action.isDisabled?.(row) ?? false;
        return (
          <Tooltip key={action.key} title={action.label}>
            <span>
              <IconButton
                size="small"
                color={action.color as "default" | undefined}
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
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const showActions = (rowActions?.length ?? 0) > 0;

  return (
    <Box sx={{ overflowX: "auto" }}>
      <Table
        size={size}
        aria-label={table.getTableProps()["aria-label"] as string}
      >
        <TableHead>
          <TableRow>
            {selection && (
              <TableCell padding="checkbox">
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
                  sx={{
                    textAlign: muiAlign(column.align),
                    width: column.width,
                  }}
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
                </TableCell>
              );
            })}
            {showActions && (
              <TableCell sx={{ textAlign: "end" }}>{labels.actions}</TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row, index) => {
            const id = getRowId(row);
            const selected = selection?.isSelected(id) ?? false;
            return (
              <TableRow
                key={getRowId(row)}
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
                    sx={{ textAlign: muiAlign(column.align) }}
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
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  return (
    <Stack spacing={1.5} role="list">
      {rows.map((row, index) => {
        const id = getRowId(row);
        return (
          <Card key={getRowId(row)} variant="outlined" role="listitem">
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
    </Stack>
  );
}
