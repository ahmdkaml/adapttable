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
  ActionIcon,
  Box,
  Button,
  Divider,
  Group,
  Popover,
  TextInput,
} from "@mantine/core";
import { useMemo, useState } from "react";

import { CloseIcon } from "../icons";

export type { SavedViewsLabels };

/** Props for {@link SavedViewsMenu}. */
export interface SavedViewsMenuProps {
  /** Storage + URL backend wiring, forwarded to core's `useSavedViews`. */
  options: UseSavedViewsOptions;
  /** Resolved table labels (trigger, save row, delete action). */
  labels: SavedViewsLabels;
}

/**
 * Saved-views menu: lists every captured view (click a name to apply it and
 * close, the trailing ✕ to delete it) above a save row that captures the
 * table's CURRENT URL state under the typed name. Arrangement and behaviour
 * come from core's shared menu; this adapter supplies Mantine's components.
 * Composes into the `toolbar` slot — or let `<DataTable savedViews>` mount it
 * for you next to the Columns menu.
 */
export function SavedViewsMenu({
  options,
  labels,
}: Readonly<SavedViewsMenuProps>) {
  const [opened, setOpened] = useState(false);
  const state = useSavedViewsMenu({
    ...options,
    onRequestClose: () => setOpened(false),
  });

  // Memoised so the shared content does not see a new component identity —
  // and remount every node — on each keystroke.
  const parts = useMemo<SavedViewsParts>(
    () => ({
      Row: ({ children }: SavedViewsRowProps) => (
        <Group gap={6} px={4} py={2} wrap="nowrap">
          {children}
        </Group>
      ),
      ApplyButton: ({ onClick, children }: SavedViewsApplyButtonProps) => (
        <Button
          variant="subtle"
          size="compact-sm"
          justify="flex-start"
          style={{ flex: 1 }}
          onClick={onClick}
        >
          {children}
        </Button>
      ),
      DeleteButton: ({ label, onClick }: SavedViewsDeleteButtonProps) => (
        <ActionIcon
          variant="subtle"
          color="gray"
          size="sm"
          aria-label={label}
          onClick={onClick}
        >
          <CloseIcon size={12} />
        </ActionIcon>
      ),
      divider: <Divider my={4} />,
      SaveRow: ({ children }: SavedViewsRowProps) => (
        <Group gap={6} p={4} wrap="nowrap">
          {children}
        </Group>
      ),
      NameInput: ({
        value,
        placeholder,
        label,
        onChange,
      }: SavedViewsNameInputProps) => (
        <TextInput
          size="xs"
          style={{ flex: 1 }}
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      ),
      SaveButton: ({
        disabled,
        onClick,
        children,
      }: SavedViewsSaveButtonProps) => (
        <Button size="xs" disabled={disabled} onClick={onClick}>
          {children}
        </Button>
      ),
    }),
    []
  );

  // A Popover, not a Menu: the panel holds buttons and a text input, so
  // `role="menu"` semantics (menuitem children, typeahead) would be a lie.
  return (
    <Popover
      opened={opened}
      onDismiss={() => setOpened(false)}
      position="bottom-end"
      withinPortal
      returnFocus
    >
      <Popover.Target>
        <Button
          variant="default"
          size="sm"
          aria-expanded={opened}
          onClick={() => setOpened((value) => !value)}
        >
          {labels.savedViews}
        </Button>
      </Popover.Target>
      <Popover.Dropdown>
        <Box p={4} miw={220}>
          <SavedViewsMenuContent state={state} labels={labels} parts={parts} />
        </Box>
      </Popover.Dropdown>
    </Popover>
  );
}
