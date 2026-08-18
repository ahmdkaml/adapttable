/** The trailing row-action buttons, shared by rows and cards. */
import {
  type ConfirmHandler,
  type RowAction,
  runRowAction,
} from "@adapttable/core";
import { resolveDisabledReason } from "@adapttable/core/adapter";
import { Button, IconButton, Stack, Tooltip } from "@mui/material";
import type { MouseEvent } from "react";

import { iconForRowAction } from "../icons";
import { muiColor } from "./DesktopTable";

export function RowActionButtons<TRow>({
  row,
  actions,
  confirm,
  cancelLabel,
}: Readonly<{
  row: TRow;
  actions: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
}>) {
  return (
    <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        const icon = iconForRowAction(action);
        const color = muiColor(action.color);
        const handleClick = disabled
          ? undefined
          : (e: MouseEvent) => {
              e.stopPropagation();
              runRowAction(action, row, confirm, cancelLabel);
            };
        return (
          <Tooltip key={action.key} title={reason ?? action.label}>
            <span>
              {icon ? (
                <IconButton
                  size="small"
                  color={color}
                  disabled={disabled}
                  aria-label={action.label}
                  onClick={handleClick}
                >
                  {icon}
                </IconButton>
              ) : (
                <Button
                  size="small"
                  color={color === "error" ? "error" : "inherit"}
                  disabled={disabled}
                  onClick={handleClick}
                >
                  {action.label}
                </Button>
              )}
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
