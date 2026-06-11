import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
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
  Box,
  Button,
  Divider,
  IconButton,
  Popover,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";

export interface ColumnMenuLabels {
  columns: string;
  pinLeft: string;
  pinRight: string;
  unpin: string;
  moveLeft: string;
  moveRight: string;
  resetColumns: string;
  showColumn: string;
  hideColumn: string;
}

export interface ColumnMenuProps<TRow> {
  allColumns: ColumnDef<TRow>[];
  layout: UseColumnLayoutResult<TRow>;
  labels: ColumnMenuLabels;
}

/**
 * MUI column-management popover: per-column drag grip (reorder), eye
 * (show/hide), and pin toggle. A `Popover` (not a `Menu`) so list keyboard
 * navigation never fights the grip's arrow-key reorder.
 */
export function ColumnMenu<TRow>({
  allColumns,
  layout,
  labels,
}: Readonly<ColumnMenuProps<TRow>>) {
  const drag = useColumnDragState();
  const [anchor, setAnchor] = useState<null | HTMLElement>(null);
  return (
    <>
      <Button
        size="small"
        variant="outlined"
        aria-expanded={anchor !== null}
        aria-haspopup="true"
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {labels.columns}
      </Button>
      <Popover
        anchorEl={anchor}
        open={anchor !== null}
        onClose={() => setAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box sx={{ p: 0.75, minWidth: 250 }}>
          <Typography
            variant="caption"
            sx={{
              display: "block",
              px: 1,
              pb: 0.5,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "text.secondary",
            }}
          >
            {labels.columns}
          </Typography>
          {columnMenuRows(allColumns, layout).map((r) => {
            // Drop-position feedback: dim the source, line the landing edge.
            const indicator = drag.rowAttrs(r.key, r.index);
            const edge = indicator["data-drop"];
            const edgeOffset = edge === "before" ? "2px" : "-2px";
            return (
              <Stack
                key={r.key}
                direction="row"
                alignItems="center"
                spacing={0.5}
                sx={{
                  px: 0.5,
                  py: 0.25,
                  cursor: "grab",
                  opacity: "data-dragging" in indicator ? 0.4 : undefined,
                  boxShadow: edge
                    ? (theme) =>
                        `inset 0 ${edgeOffset} 0 0 ${theme.palette.primary.main}`
                    : undefined,
                }}
                {...drag.rowDragProps(r.key, r.index)}
                {...drag.dropProps(r.index, layout.move)}
                {...indicator}
              >
                <IconButton
                  size="small"
                  sx={{ cursor: "grab", color: "text.disabled" }}
                  {...columnReorderKeyProps(
                    r.key,
                    r.index,
                    layout.move,
                    `${labels.moveLeft} / ${labels.moveRight}: ${r.name}`
                  )}
                >
                  <GripIcon />
                </IconButton>
                <IconButton
                  size="small"
                  aria-label={`${r.hidden ? labels.showColumn : labels.hideColumn}: ${r.name}`}
                  aria-pressed={!r.hidden}
                  color={r.hidden ? "default" : "primary"}
                  onClick={() => layout.toggleVisible(r.key)}
                >
                  <EyeIcon off={r.hidden} />
                </IconButton>
                <Typography
                  variant="body2"
                  sx={{
                    flex: 1,
                    color: r.hidden ? "text.disabled" : "text.primary",
                    textDecoration: r.hidden ? "line-through" : "none",
                  }}
                >
                  {r.name}
                </Typography>
                <IconButton
                  size="small"
                  color={r.pinned ? "primary" : "default"}
                  aria-label={`${pinActionLabel(r.pinned, labels)}: ${r.name}`}
                  onClick={() => layout.setPinned(r.key, nextPinSide(r.pinned))}
                >
                  <PinIcon />
                </IconButton>
              </Stack>
            );
          })}
          <Divider sx={{ my: 0.5 }} />
          <Button
            size="small"
            fullWidth
            sx={{ justifyContent: "flex-start" }}
            onClick={() => layout.reset()}
          >
            {labels.resetColumns}
          </Button>
        </Box>
      </Popover>
    </>
  );
}
