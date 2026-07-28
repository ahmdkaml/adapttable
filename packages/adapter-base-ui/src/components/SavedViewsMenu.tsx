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
import { Popover } from "@base-ui/react/popover";
import { useMemo, useState } from "react";

import type { BaseUiAccentColor } from "../types";
import { Button, Flex, IconButton, Separator, TextField } from "../ui";

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
  /** Accent color for the save button. */
  accentColor?: BaseUiAccentColor;
}

/**
 * Saved-views toolbar menu: a popover listing the captured views (click
 * applies and closes; the trailing × deletes) above a save row that snapshots
 * the table's CURRENT URL state under a typed name. Arrangement and behaviour
 * come from core's shared menu; this adapter supplies Base UI's components.
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
        <Flex gap="1" align="center">
          {children}
        </Flex>
      ),
      ApplyButton: ({ onClick, children }: SavedViewsApplyButtonProps) => (
        <Button
          size="1"
          variant="ghost"
          style={{ flex: 1, justifyContent: "flex-start" }}
          onClick={onClick}
        >
          {children}
        </Button>
      ),
      DeleteButton: ({ label, onClick }: SavedViewsDeleteButtonProps) => (
        <IconButton
          size="1"
          variant="ghost"
          color="gray"
          aria-label={label}
          onClick={onClick}
        >
          <CrossIcon />
        </IconButton>
      ),
      divider: <Separator my="1" size="4" />,
      SaveRow: ({ children }: SavedViewsRowProps) => (
        <Flex gap="1" align="center">
          {children}
        </Flex>
      ),
      NameInput: ({
        value,
        placeholder,
        label,
        onChange,
      }: SavedViewsNameInputProps) => (
        <TextField.Root
          size="1"
          aria-label={label}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{ flex: 1 }}
        />
      ),
      SaveButton: ({
        disabled,
        onClick,
        children,
      }: SavedViewsSaveButtonProps) => (
        <Button
          size="1"
          color={accentColor}
          variant="solid"
          disabled={disabled}
          onClick={onClick}
          style={{ flexShrink: 0 }}
        >
          {children}
        </Button>
      ),
    }),
    [accentColor]
  );

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className="adapttable-btn"
        data-size="2"
        data-variant="outline"
      >
        {labels.savedViews}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="adapttable-popup-positioner"
          side="bottom"
          align="end"
          sideOffset={8}
        >
          <Popover.Popup className="adapttable-popup" style={{ minWidth: 240 }}>
            <Flex direction="column" gap="1">
              <SavedViewsMenuContent
                state={state}
                labels={labels}
                parts={parts}
              />
            </Flex>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
