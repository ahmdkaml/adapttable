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
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  TextField,
} from "@mui/material";
import { useMemo, useState } from "react";

export type { SavedViewsLabels };

/** Props for the saved-views menu. */
export interface SavedViewsMenuProps {
  /** Storage + URL backend wiring, forwarded to core's `useSavedViews`. */
  options: UseSavedViewsOptions;
  /** Resolved table labels (trigger, save row, delete action). */
  labels: SavedViewsLabels;
}

/**
 * MUI saved-views menu: a toolbar button opening a popover that lists the
 * saved views — click applies one and closes, the trailing × deletes it —
 * above a save row that captures the table's CURRENT URL state (search,
 * sort, page, filters, column layout) under a typed name. Arrangement and
 * behaviour come from core's shared menu; this adapter supplies MUI's
 * components.
 */
export function SavedViewsMenu({
  options,
  labels,
}: Readonly<SavedViewsMenuProps>) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const state = useSavedViewsMenu({
    ...options,
    onRequestClose: () => setAnchor(null),
  });

  // Memoised so the shared content does not see a new component identity —
  // and remount every node — on each keystroke.
  const parts = useMemo<SavedViewsParts>(
    () => ({
      Row: ({ children }: SavedViewsRowProps) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          {children}
        </Stack>
      ),
      ApplyButton: ({ onClick, children }: SavedViewsApplyButtonProps) => (
        <Button
          size="small"
          fullWidth
          sx={{ justifyContent: "flex-start" }}
          onClick={onClick}
        >
          {children}
        </Button>
      ),
      DeleteButton: ({ label, onClick }: SavedViewsDeleteButtonProps) => (
        <IconButton size="small" aria-label={label} onClick={onClick}>
          ×
        </IconButton>
      ),
      divider: <Divider sx={{ my: 0.5 }} />,
      SaveRow: ({ children }: SavedViewsRowProps) => (
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          {children}
        </Stack>
      ),
      NameInput: ({
        value,
        placeholder,
        label,
        onChange,
      }: SavedViewsNameInputProps) => (
        <TextField
          size="small"
          value={value}
          placeholder={placeholder}
          slotProps={{ htmlInput: { "aria-label": label } }}
          onChange={(e) => onChange(e.target.value)}
        />
      ),
      SaveButton: ({
        disabled,
        onClick,
        children,
      }: SavedViewsSaveButtonProps) => (
        <Button
          size="small"
          variant="contained"
          disabled={disabled}
          onClick={onClick}
        >
          {children}
        </Button>
      ),
    }),
    []
  );

  return (
    <>
      <Button
        size="small"
        variant="outlined"
        aria-expanded={anchor !== null}
        aria-haspopup="true"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {labels.savedViews}
      </Button>
      <Popover
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 0.75, minWidth: 250 }}>
          <SavedViewsMenuContent state={state} labels={labels} parts={parts} />
        </Box>
      </Popover>
    </>
  );
}
