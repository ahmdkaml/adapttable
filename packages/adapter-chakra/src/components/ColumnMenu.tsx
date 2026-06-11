import type { ColumnMenuChromeProps, ColumnMenuLabels } from "@adapttable/core";
import {
  ACTIONS_COLUMN_KEY,
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

/**
 * Props for the column menu — the shared core contract, plus the injected
 * row-actions column entry (`hasRowActions` + its `actions` display name).
 */
export interface ColumnMenuProps<TRow> extends ColumnMenuChromeProps<TRow> {
  /** Resolved labels, including the actions column's display name. */
  labels: ColumnMenuLabels & { actions: string };
  /**
   * List the injected row-actions column as a separated trailing row with
   * the standard visibility toggle and a one-click end-pin toggle (the
   * actions column always trails, so it never reorders or pins left).
   */
  hasRowActions?: boolean;
}

/** Eye toggle for one menu row (a data column or the actions entry). */
function VisibilityToggle({
  hidden,
  name,
  labels,
  onToggle,
}: Readonly<{
  hidden: boolean;
  name: string;
  labels: ColumnMenuLabels;
  onToggle: () => void;
}>) {
  return (
    <IconButton
      size="xs"
      variant="ghost"
      aria-label={`${hidden ? labels.showColumn : labels.hideColumn}: ${name}`}
      aria-pressed={!hidden}
      icon={<EyeIcon off={hidden} />}
      onClick={onToggle}
    />
  );
}

/** Menu-row label, struck through while its column is hidden. */
function RowName({
  hidden,
  name,
}: Readonly<{ hidden: boolean; name: string }>) {
  return (
    <Text
      fontSize="sm"
      flex={1}
      color={hidden ? "gray.500" : undefined}
      textDecoration={hidden ? "line-through" : undefined}
    >
      {name}
    </Text>
  );
}

/** Pin toggle for one menu row; `label` names the action it performs next. */
function PinToggle({
  pinned,
  label,
  onClick,
}: Readonly<{ pinned: boolean; label: string; onClick: () => void }>) {
  return (
    <IconButton
      size="xs"
      variant={pinned ? "solid" : "ghost"}
      colorScheme={pinned ? "teal" : "gray"}
      aria-label={label}
      icon={<PinIcon />}
      onClick={onClick}
    />
  );
}

/**
 * Chakra column-management popover: per-column drag grip (reorder), eye
 * (show/hide), and pin toggle — plus, when the table has row actions, a
 * trailing entry that hides or end-pins the injected actions column.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
  hasRowActions,
}: Readonly<ColumnMenuProps<TRow>>) {
  const drag = useColumnDragState();
  const actionsHidden = layout.isHidden(ACTIONS_COLUMN_KEY);
  const actionsPinned = layout.state.pinned[ACTIONS_COLUMN_KEY] === "right";
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
                  <VisibilityToggle
                    hidden={r.hidden}
                    name={r.name}
                    labels={labels}
                    onToggle={() => layout.toggleVisible(r.key)}
                  />
                  <RowName hidden={r.hidden} name={r.name} />
                  <PinToggle
                    pinned={Boolean(r.pinned)}
                    label={`${pinActionLabel(r.pinned, labels)}: ${r.name}`}
                    onClick={() =>
                      layout.setPinned(r.key, nextPinSide(r.pinned))
                    }
                  />
                </HStack>
              );
            })}
            {hasRowActions && (
              <>
                <Divider my={1} />
                <HStack spacing={1} py={0.5}>
                  <VisibilityToggle
                    hidden={actionsHidden}
                    name={labels.actions}
                    labels={labels}
                    onToggle={() => layout.toggleVisible(ACTIONS_COLUMN_KEY)}
                  />
                  <RowName hidden={actionsHidden} name={labels.actions} />
                  <PinToggle
                    pinned={actionsPinned}
                    label={`${actionsPinned ? labels.unpin : labels.pinRight}: ${labels.actions}`}
                    onClick={() =>
                      layout.setPinned(
                        ACTIONS_COLUMN_KEY,
                        actionsPinned ? undefined : "right"
                      )
                    }
                  />
                </HStack>
              </>
            )}
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
