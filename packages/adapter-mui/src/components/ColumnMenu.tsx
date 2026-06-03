import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

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

/** Built-in MUI column-management menu: show/hide, pin, reorder, reset. */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  const visibleKeys = layout.visibleColumns.map((c) => c.key);
  return (
    <>
      <Button
        size="small"
        variant="outlined"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {labels.columns}
      </Button>
      <Menu
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
      >
        {allColumns.map((column) => {
          const key = column.key;
          const pinned = layout.state.pinned[key];
          const visIndex = visibleKeys.indexOf(key);
          return (
            <MenuItem key={key} disableRipple dense>
              <Stack
                direction="row"
                alignItems="center"
                justifyContent="space-between"
                spacing={1}
                sx={{ width: "100%", minWidth: 240 }}
              >
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <Checkbox
                    size="small"
                    checked={!layout.isHidden(key)}
                    onChange={() => layout.toggleVisible(key)}
                    slotProps={{
                      input: { "aria-label": columnLabel(column) },
                    }}
                  />
                  <Typography variant="body2">{columnLabel(column)}</Typography>
                </Box>
                <Stack direction="row" spacing={0}>
                  <IconButton
                    size="small"
                    color={pinned === "left" ? "primary" : "default"}
                    aria-label={`${pinned === "left" ? labels.unpin : labels.pinLeft}: ${columnLabel(column)}`}
                    onClick={() =>
                      layout.setPinned(
                        key,
                        pinned === "left" ? undefined : "left"
                      )
                    }
                  >
                    ⇤
                  </IconButton>
                  <IconButton
                    size="small"
                    color={pinned === "right" ? "primary" : "default"}
                    aria-label={`${pinned === "right" ? labels.unpin : labels.pinRight}: ${columnLabel(column)}`}
                    onClick={() =>
                      layout.setPinned(
                        key,
                        pinned === "right" ? undefined : "right"
                      )
                    }
                  >
                    ⇥
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={visIndex <= 0}
                    aria-label={`${labels.moveLeft}: ${columnLabel(column)}`}
                    onClick={() => layout.move(key, visIndex - 1)}
                  >
                    ←
                  </IconButton>
                  <IconButton
                    size="small"
                    disabled={
                      visIndex < 0 || visIndex >= visibleKeys.length - 1
                    }
                    aria-label={`${labels.moveRight}: ${columnLabel(column)}`}
                    onClick={() => layout.move(key, visIndex + 1)}
                  >
                    →
                  </IconButton>
                </Stack>
              </Stack>
            </MenuItem>
          );
        })}
        <Divider />
        <MenuItem onClick={() => layout.reset()}>
          {labels.resetColumns}
        </MenuItem>
      </Menu>
    </>
  );
}
