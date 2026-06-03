import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  Text,
} from "@chakra-ui/react";

function columnLabel<TRow>(column: ColumnDef<TRow>): string {
  if (typeof column.header === "string") return column.header;
  return column.mobileLabel ?? column.key;
}

export interface ColumnMenuLabels {
  columns: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  moveLeft: string;
  moveRight: string;
  resetColumns: string;
}

export interface ColumnMenuProps<TRow> {
  allColumns: ColumnDef<TRow>[];
  layout: UseColumnLayoutResult<TRow>;
  labels: ColumnMenuLabels;
}

/** Built-in Chakra column-management menu: show/hide, pin, reorder, reset. */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  const visibleKeys = layout.visibleColumns.map((c) => c.key);
  return (
    <Menu closeOnSelect={false} placement="bottom-end">
      <MenuButton as={Button} size="sm" variant="outline">
        {labels.columns}
      </MenuButton>
      <MenuList minW="260px" px={2}>
        {allColumns.map((column) => {
          const key = column.key;
          const pinned = layout.state.pinned[key];
          const visIndex = visibleKeys.indexOf(key);
          return (
            <HStack key={key} justify="space-between" py={1} spacing={2}>
              <Checkbox
                size="sm"
                isChecked={!layout.isHidden(key)}
                onChange={() => layout.toggleVisible(key)}
              >
                <Text fontSize="sm">{columnLabel(column)}</Text>
              </Checkbox>
              <HStack spacing={0}>
                <IconButton
                  size="xs"
                  variant={pinned === "left" ? "solid" : "ghost"}
                  aria-label={`${pinned === "left" ? labels.unpin : labels.pinLeft}: ${columnLabel(column)}`}
                  icon={<span>⇤</span>}
                  onClick={() =>
                    layout.setPinned(
                      key,
                      pinned === "left" ? undefined : "left"
                    )
                  }
                />
                <IconButton
                  size="xs"
                  variant={pinned === "right" ? "solid" : "ghost"}
                  aria-label={`${pinned === "right" ? labels.unpin : labels.pinRight}: ${columnLabel(column)}`}
                  icon={<span>⇥</span>}
                  onClick={() =>
                    layout.setPinned(
                      key,
                      pinned === "right" ? undefined : "right"
                    )
                  }
                />
                <IconButton
                  size="xs"
                  variant="ghost"
                  isDisabled={visIndex <= 0}
                  aria-label={`${labels.moveLeft}: ${columnLabel(column)}`}
                  icon={<span>←</span>}
                  onClick={() => layout.move(key, visIndex - 1)}
                />
                <IconButton
                  size="xs"
                  variant="ghost"
                  isDisabled={
                    visIndex < 0 || visIndex >= visibleKeys.length - 1
                  }
                  aria-label={`${labels.moveRight}: ${columnLabel(column)}`}
                  icon={<span>→</span>}
                  onClick={() => layout.move(key, visIndex + 1)}
                />
              </HStack>
            </HStack>
          );
        })}
        <Divider my={1} />
        <Box px={1} pb={1}>
          <Button size="xs" variant="ghost" onClick={() => layout.reset()}>
            {labels.resetColumns}
          </Button>
        </Box>
      </MenuList>
    </Menu>
  );
}
