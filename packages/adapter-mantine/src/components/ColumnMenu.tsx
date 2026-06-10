import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import {
  columnDropProps,
  columnMenuRows,
  columnReorderKeyProps,
  columnRowDragProps,
  EyeIcon,
  GripIcon,
  nextPinSide,
  pinActionLabel,
  PinIcon,
} from "@adapttable/core";
import { ActionIcon, Box, Button, Group, Menu, Text } from "@mantine/core";

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
    showColumn: string;
    hideColumn: string;
  };
}

/**
 * Column-management popover: per-column drag grip (reorder), eye (show/hide),
 * and pin toggle. Keyboard users focus a grip and use arrow keys.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  return (
    <Menu closeOnItemClick={false} position="bottom-end" withinPortal>
      <Menu.Target>
        <Button variant="default" size="sm">
          {labels.columns}
        </Button>
      </Menu.Target>
      <Menu.Dropdown>
        <Box p={4} miw={250}>
          <Text size="xs" c="dimmed" fw={600} tt="uppercase" px={4} pb={6}>
            {labels.columns}
          </Text>
          {columnMenuRows(allColumns, layout).map((r) => (
            <Group
              key={r.key}
              justify="flex-start"
              wrap="nowrap"
              gap={6}
              px={4}
              py={2}
              style={{ cursor: "grab" }}
              {...columnRowDragProps(r.key)}
              {...columnDropProps(r.index, layout.move)}
            >
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                style={{ cursor: "grab" }}
                {...columnReorderKeyProps(
                  r.key,
                  r.index,
                  layout.move,
                  `${labels.moveLeft} / ${labels.moveRight}: ${r.name}`
                )}
              >
                <GripIcon />
              </ActionIcon>
              <ActionIcon
                variant={r.hidden ? "subtle" : "light"}
                color={r.hidden ? "gray" : "blue"}
                size="sm"
                aria-label={`${r.hidden ? labels.showColumn : labels.hideColumn}: ${r.name}`}
                aria-pressed={!r.hidden}
                onClick={() => layout.toggleVisible(r.key)}
              >
                <EyeIcon off={r.hidden} />
              </ActionIcon>
              <Text
                size="sm"
                style={{ flex: 1 }}
                c={r.hidden ? "dimmed" : undefined}
                td={r.hidden ? "line-through" : undefined}
              >
                {r.name}
              </Text>
              <ActionIcon
                variant={r.pinned ? "filled" : "subtle"}
                color={r.pinned ? "blue" : "gray"}
                size="sm"
                aria-label={`${pinActionLabel(r.pinned, labels)}: ${r.name}`}
                onClick={() => layout.setPinned(r.key, nextPinSide(r.pinned))}
              >
                <PinIcon />
              </ActionIcon>
            </Group>
          ))}
          <Menu.Divider />
          <Button
            variant="subtle"
            size="xs"
            fullWidth
            justify="flex-start"
            onClick={() => layout.reset()}
          >
            {labels.resetColumns}
          </Button>
        </Box>
      </Menu.Dropdown>
    </Menu>
  );
}
