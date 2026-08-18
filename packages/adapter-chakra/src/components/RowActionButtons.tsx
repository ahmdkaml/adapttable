/** The trailing row-action buttons, shared by rows and cards. */
import {
  type ConfirmHandler,
  type RowAction,
  runRowAction,
} from "@adapttable/core";
import { resolveDisabledReason } from "@adapttable/core/adapter";
import { Button, HStack, IconButton } from "@chakra-ui/react";

import { iconForRowAction } from "../icons";
import { Tooltip } from "./primitives";

export function RowActionButtons<TRow>({
  row,
  actions,
  confirm,
  cancelLabel,
  accentColor,
}: Readonly<{
  row: TRow;
  actions: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
  accentColor?: string;
}>) {
  return (
    <HStack gap={1} justify="flex-end">
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        // The disabled attribute already blocks activation, so attach the
        // handler only when the action can run.
        const handleClick = disabled
          ? undefined
          : (e: React.MouseEvent) => {
              e.stopPropagation();
              runRowAction(action, row, confirm, cancelLabel);
            };
        // Icon-only actions use IconButton (with a tooltip for the name);
        // text actions use a real Button so the label actually renders
        // (IconButton renders only the icon child).
        const icon = iconForRowAction(action);
        return icon ? (
          <Tooltip key={action.key} label={reason ?? action.label}>
            <IconButton
              size="sm"
              variant="ghost"
              colorPalette={action.color ?? accentColor}
              disabled={disabled}
              aria-label={action.label}
              onClick={handleClick}
            >
              {icon}
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip key={action.key} label={reason ?? action.label}>
            <Button
              size="sm"
              variant="ghost"
              colorPalette={action.color ?? accentColor}
              disabled={disabled}
              onClick={handleClick}
            >
              {action.label}
            </Button>
          </Tooltip>
        );
      })}
    </HStack>
  );
}
