import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import {
  columnDropProps,
  columnMenuRows,
  columnReorderKeyProps,
  columnRowDragProps,
  EyeIcon,
  GripIcon,
  PinIcon,
} from "@adapttable/core";
import {
  Button,
  Divider,
  HStack,
  IconButton,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Text,
} from "@chakra-ui/react";

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

/**
 * Chakra column-management popover: per-column drag grip (reorder), eye
 * (show/hide), and pin toggle.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  return (
    <Popover placement="bottom-end" isLazy>
      <PopoverTrigger>
        <Button size="sm" variant="outline">
          {labels.columns}
        </Button>
      </PopoverTrigger>
      <Portal>
        <PopoverContent minW="260px" w="auto">
          <PopoverBody px={2} py={2}>
            <Text
              fontSize="xs"
              fontWeight="600"
              textTransform="uppercase"
              letterSpacing="0.06em"
              color="gray.500"
              px={1}
              pb={1}
            >
              {labels.columns}
            </Text>
            {columnMenuRows(allColumns, layout).map((r) => (
              <HStack
                key={r.key}
                spacing={1}
                py={0.5}
                cursor="grab"
                {...columnRowDragProps(r.key)}
                {...columnDropProps(r.index, layout.move)}
              >
                <IconButton
                  size="xs"
                  variant="ghost"
                  cursor="grab"
                  icon={<GripIcon />}
                  {...columnReorderKeyProps(
                    r.key,
                    r.index,
                    layout.move,
                    `${labels.moveLeft} / ${labels.moveRight}: ${r.name}`
                  )}
                />
                <IconButton
                  size="xs"
                  variant="ghost"
                  aria-label={r.name}
                  aria-pressed={!r.hidden}
                  icon={<EyeIcon off={r.hidden} />}
                  onClick={() => layout.toggleVisible(r.key)}
                />
                <Text
                  fontSize="sm"
                  flex={1}
                  color={r.hidden ? "gray.500" : undefined}
                  textDecoration={r.hidden ? "line-through" : undefined}
                >
                  {r.name}
                </Text>
                <IconButton
                  size="xs"
                  variant={r.pinnedLeft ? "solid" : "ghost"}
                  colorScheme={r.pinnedLeft ? "teal" : "gray"}
                  aria-label={`${r.pinnedLeft ? labels.unpin : labels.pinLeft}: ${r.name}`}
                  icon={<PinIcon />}
                  onClick={() =>
                    layout.setPinned(r.key, r.pinnedLeft ? undefined : "left")
                  }
                />
              </HStack>
            ))}
            <Divider my={1} />
            <Button size="xs" variant="ghost" onClick={() => layout.reset()}>
              {labels.resetColumns}
            </Button>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  );
}
