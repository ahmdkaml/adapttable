import type { RowAction } from "../types";

/** A confirmation request raised by a row or bulk action. */
export interface ConfirmRequest {
  /** Dialog title. */
  title: string;
  /** Dialog message. */
  message: string;
  /** Confirm button label. */
  confirmLabel: string;
  /** Cancel button label. */
  cancelLabel: string;
  /** Marks the action destructive. */
  danger?: boolean;
  /** Runs when the user accepts. */
  onConfirm: () => void;
}

/** Shows a confirmation, then runs `onConfirm` if accepted. */
export type ConfirmHandler = (request: ConfirmRequest) => void;

/**
 * The default confirmation handler — a dependency-free `window.confirm`.
 * Adapters pass a styled handler when they have one.
 */
export const defaultConfirm: ConfirmHandler = ({ message, onConfirm }) => {
  const native = (globalThis as { confirm?: (m?: string) => boolean }).confirm;
  if (typeof native !== "function" || native(message)) {
    onConfirm();
  }
};

/**
 * Run a row action, routing through `confirm` first when the action
 * declares a `confirm` block.
 *
 * @typeParam TRow - The row type.
 * @param action - The action to run.
 * @param row - The row it was triggered on.
 * @param confirm - The confirmation handler.
 * @param cancelLabel - Cancel label for the dialog.
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
