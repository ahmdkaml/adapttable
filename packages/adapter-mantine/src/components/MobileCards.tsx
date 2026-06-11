import {
  type ColumnDef,
  resolveDisabledReason,
  rowClickProps,
  runRowAction,
  type SharedTableRenderProps,
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

import type { Density } from "../density";
import { ExpandToggle } from "./ExpandToggle";

/**
 * Props for {@link MobileCards}: the card-relevant slice of core's shared
 * render contract (no header/pinning/resize concerns on mobile) plus the
 * Mantine-specific extras.
 */
export interface MobileCardsProps<TRow> extends Pick<
  SharedTableRenderProps<TRow>,
  | "table"
  | "rows"
  | "rowActions"
  | "confirm"
  | "getRowId"
  | "onRowClick"
  | "rowClassName"
  | "renderRowDetail"
  | "expansion"
  | "rowEntries"
  | "paddingTop"
  | "paddingBottom"
  | "measureElement"
> {
  bodyRef: RefObject<HTMLDivElement>;
  className?: string;
  density?: Density;
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
  rowEntries,
  paddingTop = 0,
  paddingBottom = 0,
  measureElement,
  density = "comfortable",
  onRowClick,
  rowClassName,
  renderRowDetail,
  expansion,
}: Readonly<MobileCardsProps<TRow>>) {
  const { columns, selection, labels } = table;
  const compact = density === "compact";
  const entries =
    rowEntries ??
    rows.map((row, index) => ({
      row,
      index,
      key: getRowId(row),
    }));

  return (
    <Stack
      gap={compact ? "xs" : "sm"}
      ref={bodyRef}
      className={className}
      {...table.getTableProps({ role: "list" })}
    >
      {paddingTop > 0 && <div aria-hidden style={{ height: paddingTop }} />}
      {entries.map(({ row, index, key }) => {
        const id = getRowId(row);
        return (
          <Card
            key={key}
            {...rowClickProps(row, onRowClick)}
            className={rowClassName?.(row, index)}
            ref={measureElement}
            data-index={index}
            withBorder
            radius="md"
            padding={compact ? "sm" : "md"}
            role="listitem"
            data-stagger=""
          >
            <Stack gap={compact ? 4 : "xs"}>
              {selection && (
                <Checkbox
                  aria-label={labels.selectRow}
                  checked={selection.isSelected(id)}
                  onChange={() => selection.toggle(id)}
                />
              )}
              {expansion && (
                <Group justify="flex-end">
                  <ExpandToggle
                    expanded={expansion.isExpanded(id)}
                    expandLabel={labels.expandRow}
                    collapseLabel={labels.collapseRow}
                    onToggle={() => expansion.toggle(id)}
                  />
                </Group>
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
              {expansion?.isExpanded(id) === true && (
                <div>{renderRowDetail!(row)}</div>
              )}
              {rowActions && rowActions.length > 0 && (
                <Group gap={4} justify="flex-end" pt={4}>
                  {rowActions.map((action) => {
                    if (action.isHidden?.(row)) return null;
                    const reason = resolveDisabledReason(
                      action.disabledReason?.(row)
                    );
                    const disabled =
                      reason !== undefined ||
                      (action.isDisabled?.(row) ?? false);
                    // The disabled attribute already blocks activation, so
                    // attach the handler only when the action can run.
                    const run = disabled
                      ? undefined
                      : () => runRowAction(action, row, confirm, labels.cancel);
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
      {paddingBottom > 0 && (
        <div aria-hidden style={{ height: paddingBottom }} />
      )}
    </Stack>
  );
}
