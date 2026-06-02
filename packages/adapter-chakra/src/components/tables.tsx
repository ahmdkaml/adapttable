import {
  type ColumnDef,
  type ConfirmHandler,
  type RowAction,
  runRowAction,
  type UseDataTableResult,
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
  TableContainer,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from "@chakra-ui/react";

import { subtleText } from "../styles";

interface SharedProps<TRow> {
  table: UseDataTableResult<TRow>;
  rows: readonly TRow[];
  rowActions?: RowAction<TRow>[];
  confirm: ConfirmHandler;
  getRowId: (row: TRow) => string;
  size: "sm" | "md" | "lg";
  colorScheme?: string;
  prefetch?: (row: TRow) => void;
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
        const disabled = action.isDisabled?.(row) ?? false;
        const handleClick = (e: React.MouseEvent) => {
          e.stopPropagation();
          if (!disabled) runRowAction(action, row, confirm, cancelLabel);
        };
        // Icon-only actions use IconButton (with a tooltip for the name);
        // text actions use a real Button so the label actually renders
        // (IconButton ignores children).
        return action.icon ? (
          <Tooltip key={action.key} label={action.label}>
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
          <Button
            key={action.key}
            size="sm"
            variant="ghost"
            colorScheme={action.color ?? colorScheme}
            isDisabled={disabled}
            onClick={handleClick}
          >
            {action.label}
          </Button>
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
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  const showActions = (rowActions?.length ?? 0) > 0;

  return (
    <TableContainer>
      <Table
        size={size}
        aria-label={table.getTableProps()["aria-label"] as string}
      >
        <Thead>
          <Tr>
            {selection && (
              <Th>
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
                >
                  {column.sortable ? (
                    <Box
                      as="button"
                      type="button"
                      cursor="pointer"
                      aria-label={`${labels.sortBy}: ${
                        typeof column.header === "string"
                          ? column.header
                          : column.key
                      }`}
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
                </Th>
              );
            })}
            {showActions && <Th textAlign="end">{labels.actions}</Th>}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((row, index) => {
            const id = getRowId(row);
            const selected = selection?.isSelected(id);
            return (
              <Tr
                key={getRowId(row)}
                bg={selected ? "blackAlpha.100" : undefined}
                _dark={{ bg: selected ? "whiteAlpha.200" : undefined }}
                onMouseEnter={prefetch ? () => prefetch(row) : undefined}
              >
                {selection && (
                  <Td>
                    <Checkbox
                      aria-label={labels.selectRow}
                      isChecked={selection.isSelected(id)}
                      onChange={() => selection.toggle(id)}
                    />
                  </Td>
                )}
                {columns.map((column) => (
                  <Td key={column.key} textAlign={chakraAlign(column.align)}>
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </Td>
                ))}
                {showActions && (
                  <Td textAlign="end">
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
        </Tbody>
      </Table>
    </TableContainer>
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
  colorScheme,
}: Readonly<SharedProps<TRow>>) {
  const { columns, selection, labels } = table;
  return (
    <Stack spacing={3} role="list">
      {rows.map((row, index) => {
        const id = getRowId(row);
        return (
          <Card key={getRowId(row)} variant="outline" role="listitem">
            <CardBody>
              {selection && (
                <Checkbox
                  aria-label={labels.selectRow}
                  isChecked={selection.isSelected(id)}
                  onChange={() => selection.toggle(id)}
                  mb={2}
                />
              )}
              {columns.map((column) => (
                <Box key={column.key} mb={2}>
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
    </Stack>
  );
}
