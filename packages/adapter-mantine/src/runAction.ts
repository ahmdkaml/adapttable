import type { RowAction } from "@adapttable/core";

import type { ConfirmHandler } from "./types";

/**
 * Run a row action, routing through the confirmation handler first when
 * the action declares a `confirm` block.
 *
 * @typeParam TRow - The row type.
 * @param action - The action to run.
 * @param row - The row it was triggered on.
 * @param confirm - The resolved confirmation handler.
 * @param cancelLabel - Cancel button label for the confirm dialog.
 */
export function runRowAction<TRow>(
  action: RowAction<TRow>,
  row: TRow,
  confirm: ConfirmHandler,
  cancelLabel: string
): void {
  if (!action.confirm) {
    action.onClick(row);
    return;
  }
  confirm({
    title: action.confirm.title,
    message: action.confirm.message(row),
    confirmLabel: action.confirm.confirmLabel,
    cancelLabel,
    danger: action.confirm.danger,
    onConfirm: () => action.onClick(row),
  });
}
