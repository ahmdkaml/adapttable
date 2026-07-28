import type { UseSavedViewsOptions } from "@adapttable/core";
import {
  type SavedViewsApplyButtonProps,
  type SavedViewsDeleteButtonProps,
  type SavedViewsLabels,
  SavedViewsMenuContent,
  type SavedViewsNameInputProps,
  type SavedViewsParts,
  type SavedViewsRowProps,
  type SavedViewsSaveButtonProps,
  useSavedViewsMenu,
} from "@adapttable/core/adapter";
import {
  Button,
  HStack,
  IconButton,
  Input,
  Popover,
  Portal,
  Separator,
} from "@chakra-ui/react";
import { useMemo, useState } from "react";

export type { SavedViewsLabels };

/** Small × glyph for the per-view delete button. */
function CrossIcon() {
  return (
    <svg
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}

export interface SavedViewsMenuProps {
  /** Forwarded to core's `useSavedViews` (storage key, adapter, urlKey, …). */
  options: UseSavedViewsOptions;
  /** The four saved-view strings (pass `table.labels` or your own). */
  labels: SavedViewsLabels;
  /** Chakra color scheme for the save button. */
  accentColor?: string;
}

/**
 * Saved-views toolbar menu: a popover listing the captured views (click
 * applies and closes; the trailing × deletes) above a save row that snapshots
 * the table's CURRENT URL state under a typed name. Arrangement and behaviour
 * come from core's shared menu; this adapter supplies Chakra's components.
 */
export function SavedViewsMenu({
  options,
  labels,
  accentColor,
}: Readonly<SavedViewsMenuProps>) {
  const [open, setOpen] = useState(false);
  const state = useSavedViewsMenu({
    ...options,
    onRequestClose: () => setOpen(false),
  });

  // Memoised so the shared content does not see a new component identity —
  // and remount every node — on each keystroke.
  const parts = useMemo<SavedViewsParts>(
    () => ({
      Row: ({ children }: SavedViewsRowProps) => (
        <HStack gap={1} py={0.5}>
          {children}
        </HStack>
      ),
      ApplyButton: ({ onClick, children }: SavedViewsApplyButtonProps) => (
        <Button
          size="xs"
          variant="ghost"
          fontWeight="normal"
          flex={1}
          justifyContent="flex-start"
          onClick={onClick}
        >
          {children}
        </Button>
      ),
      DeleteButton: ({ label, onClick }: SavedViewsDeleteButtonProps) => (
        <IconButton
          size="xs"
          variant="ghost"
          aria-label={label}
          onClick={onClick}
        >
          <CrossIcon />
        </IconButton>
      ),
      divider: <Separator my={1} />,
      SaveRow: ({ children }: SavedViewsRowProps) => (
        <HStack gap={1}>{children}</HStack>
      ),
      NameInput: ({
        value,
        placeholder,
        label,
        onChange,
      }: SavedViewsNameInputProps) => (
        <Input
          size="xs"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      ),
      SaveButton: ({
        disabled,
        onClick,
        children,
      }: SavedViewsSaveButtonProps) => (
        <Button
          size="xs"
          flexShrink={0}
          colorPalette={accentColor}
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      ),
    }),
    [accentColor]
  );

  return (
    <Popover.Root
      open={open}
      onOpenChange={(e) => setOpen(e.open)}
      positioning={{ placement: "bottom-end" }}
      lazyMount
    >
      <Popover.Trigger asChild>
        <Button size="sm" variant="outline">
          {labels.savedViews}
        </Button>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content minW="240px" w="auto">
            <Popover.Body px={2} py={2}>
              <SavedViewsMenuContent
                state={state}
                labels={labels}
                parts={parts}
              />
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
