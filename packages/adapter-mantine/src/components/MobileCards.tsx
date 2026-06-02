import {
  type ColumnDef,
  type ConfirmHandler,
  type RowAction,
  runRowAction,
  type UseDataTableResult,
} from "@adapttable/core";
import {
  ActionIcon,
  Button,
  Card,
  Checkbox,
  Group,
  Stack,
  Text,
  Tooltip,
} from "@mantine/core";
import type { RefObject } from "react";

/** Props for {@link MobileCards}. */
export interface MobileCardsProps<TRow> {
  table: UseDataTableResult<TRow>;
  rows: readonly TRow[];
  rowActions?: RowAction<TRow>[];
  confirm: ConfirmHandler;
  getRowId: (row: TRow) => string;
  bodyRef: RefObject<HTMLDivElement>;
  className?: string;
}

function mobileLabel<TRow>(column: ColumnDef<TRow>): string {
  return (
    column.mobileLabel ??
    (typeof column.header === "string" ? column.header : column.key)
  );
}

/** Mobile rendering: one Mantine Card per row with labelled key/value rows. */
export function MobileCards<TRow>({
  table,
  rows,
  rowActions,
  confirm,
  getRowId,
  bodyRef,
  className,
}: Readonly<MobileCardsProps<TRow>>) {
  const { columns, selection, labels } = table;

  return (
    <Stack
      gap="sm"
      ref={bodyRef}
      className={className}
      {...table.getTableProps({ role: "list" })}
    >
      {rows.map((row, index) => {
        const id = getRowId(row);
        return (
          <Card
            key={id}
            withBorder
            radius="md"
            padding="md"
            role="listitem"
            data-stagger=""
          >
            <Stack gap="xs">
              {selection && (
                <Checkbox
                  aria-label={labels.selectRow}
                  checked={selection.isSelected(id)}
                  onChange={() => selection.toggle(id)}
                />
              )}
              {columns.map((column) => (
                <div key={column.key}>
                  <Text fz="xs" c="dimmed" tt="uppercase" fw={500}>
                    {mobileLabel(column)}
                  </Text>
                  <Text fz="sm">
                    {column.Cell ? (
                      <column.Cell row={row} rowIndex={index} />
                    ) : (
                      column.accessor?.(row)
                    )}
                  </Text>
                </div>
              ))}
              {rowActions && rowActions.length > 0 && (
                <Group gap={4} justify="flex-end" pt={4}>
                  {rowActions.map((action) => {
                    if (action.isHidden?.(row)) return null;
                    const disabled = action.isDisabled?.(row) ?? false;
                    const run = () => {
                      if (!disabled) {
                        runRowAction(action, row, confirm, labels.cancel);
                      }
                    };
                    return action.icon ? (
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
                          onClick={run}
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
                        onClick={run}
                      >
                        {action.label}
                      </Button>
                    );
                  })}
                </Group>
              )}
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
}
