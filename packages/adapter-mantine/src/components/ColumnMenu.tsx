import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import {
  ActionIcon,
  Button,
  Checkbox,
  Group,
  Menu,
  Stack,
  Text,
} from "@mantine/core";

/** Resolve a readable column label for the menu. */
function columnLabel<TRow>(column: ColumnDef<TRow>): string {
  if (typeof column.header === "string") return column.header;
  return column.mobileLabel ?? column.key;
}

/** Props for {@link ColumnMenu}. */
export interface ColumnMenuProps<TRow> {
  allColumns: ColumnDef<TRow>[];
  layout: UseColumnLayoutResult<TRow>;
  labels: {
    columns: string;
    pinLeft: string;
    pinRight: string;
    unpin: string;
    moveLeft: string;
    moveRight: string;
    resetColumns: string;
  };
}

/** Built-in column-management menu: show/hide, pin, reorder, reset. */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  const visibleKeys = layout.visibleColumns.map((c) => c.key);
  return (
    <Menu closeOnItemClick={false} position="bottom-end" withinPortal>
      <Menu.Target>
        <Button variant="default" size="sm">
          {labels.columns}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Stack gap={4} p={4} miw={240}>
          {allColumns.map((column) => {
            const key = column.key;
            const pinned = layout.state.pinned[key];
            const visIndex = visibleKeys.indexOf(key);
            return (
              <Group key={key} justify="space-between" wrap="nowrap" gap="sm">
                <Checkbox
                  size="sm"
                  label={columnLabel(column)}
                  checked={!layout.isHidden(key)}
                  onChange={() => layout.toggleVisible(key)}
                />
                <Group gap={2} wrap="nowrap">
                  <ActionIcon
                    variant={pinned === "left" ? "filled" : "subtle"}
                    size="sm"
                    aria-label={`${pinned === "left" ? labels.unpin : labels.pinLeft}: ${columnLabel(column)}`}
                    onClick={() =>
                      layout.setPinned(
                        key,
                        pinned === "left" ? undefined : "left"
                      )
                    }
                  >
                    <Text size="xs">⇤</Text>
                  </ActionIcon>
                  <ActionIcon
                    variant={pinned === "right" ? "filled" : "subtle"}
                    size="sm"
                    aria-label={`${pinned === "right" ? labels.unpin : labels.pinRight}: ${columnLabel(column)}`}
                    onClick={() =>
                      layout.setPinned(
                        key,
                        pinned === "right" ? undefined : "right"
                      )
                    }
                  >
                    <Text size="xs">⇥</Text>
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    disabled={visIndex <= 0}
                    aria-label={`${labels.moveLeft}: ${columnLabel(column)}`}
                    onClick={() => layout.move(key, visIndex - 1)}
                  >
                    <Text size="xs">←</Text>
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    size="sm"
                    disabled={
                      visIndex < 0 || visIndex >= visibleKeys.length - 1
                    }
                    aria-label={`${labels.moveRight}: ${columnLabel(column)}`}
                    onClick={() => layout.move(key, visIndex + 1)}
                  >
                    <Text size="xs">→</Text>
                  </ActionIcon>
                </Group>
              </Group>
            );
          })}
          <Menu.Divider />
          <Button variant="subtle" size="xs" onClick={() => layout.reset()}>
            {labels.resetColumns}
          </Button>
        </Stack>
      </Menu.Dropdown>
    </Menu>
  );
}
