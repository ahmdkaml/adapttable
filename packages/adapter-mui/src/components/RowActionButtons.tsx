/** The trailing row-action buttons, shared by rows and cards. */
import {
  type ConfirmHandler,
  type RowAction,
  runRowAction,
} from "@adapttable/core";
import { resolveDisabledReason } from "@adapttable/core/adapter";
import { IconButton, Stack, Tooltip, Typography } from "@mui/material";

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
        return (
          <Tooltip key={action.key} title={reason ?? action.label}>
            <span>
              <IconButton
                size="small"
                color={muiColor(action.color)}
                disabled={disabled}
                aria-label={action.label}
                onClick={
                  // The disabled attribute already blocks activation, so
                  // attach the handler only when the action can run.
                  disabled
                    ? undefined
                    : (e) => {
                        e.stopPropagation();
                        runRowAction(action, row, confirm, cancelLabel);
                      }
                }
              >
                {action.icon ?? (
                  <Typography variant="caption">{action.label}</Typography>
                )}
              </IconButton>
            </span>
          </Tooltip>
        );
      })}
    </Stack>
  );
}
