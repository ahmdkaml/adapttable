import type { ColumnMenuChromeProps } from "@adapttable/core";
import {
  columnMenuRows,
  columnReorderKeyProps,
  EyeIcon,
  GripIcon,
  nextPinSide,
  pinActionLabel,
  PinIcon,
  useColumnDragState,
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

/** Props for the column menu — the shared core contract. */
export type ColumnMenuProps<TRow> = ColumnMenuChromeProps<TRow>;

/**
 * Chakra column-management popover: per-column drag grip (reorder), eye
 * (show/hide), and pin toggle.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  const drag = useColumnDragState();
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
            {columnMenuRows(allColumns, layout).map((r) => {
              // Drop-position feedback: dim the source, line the landing edge.
              const indicator = drag.rowAttrs(r.key, r.index);
              const edge = indicator["data-drop"];
              const edgeOffset = edge === "before" ? "2px" : "-2px";
              return (
                <HStack
                  key={r.key}
                  spacing={1}
                  py={0.5}
                  cursor="grab"
                  opacity={"data-dragging" in indicator ? 0.4 : undefined}
                  boxShadow={
                    edge
                      ? `inset 0 ${edgeOffset} 0 0 var(--chakra-colors-blue-500)`
                      : undefined
                  }
                  {...drag.rowDragProps(r.key, r.index)}
                  {...drag.dropProps(r.index, layout.move)}
                  {...indicator}
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
                    aria-label={`${r.hidden ? labels.showColumn : labels.hideColumn}: ${r.name}`}
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
                    variant={r.pinned ? "solid" : "ghost"}
                    colorScheme={r.pinned ? "teal" : "gray"}
                    aria-label={`${pinActionLabel(r.pinned, labels)}: ${r.name}`}
                    icon={<PinIcon />}
                    onClick={() =>
                      layout.setPinned(r.key, nextPinSide(r.pinned))
                    }
                  />
                </HStack>
              );
            })}
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
