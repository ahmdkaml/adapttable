/** The trailing row-action buttons, shared by rows and cards. */
import {
  type ConfirmHandler,
  type RowAction,
  runRowAction,
} from "@adapttable/core";
import { resolveDisabledReason } from "@adapttable/core/adapter";
import type { MouseEvent } from "react";

import type { DataTableClassNames } from "../types";

export function RowActionButtons<TRow>({
  row,
  actions,
  confirm,
  cancelLabel,
  classNames,
}: Readonly<{
  row: TRow;
  actions: RowAction<TRow>[];
  confirm: ConfirmHandler;
  cancelLabel: string;
  classNames: DataTableClassNames;
}>) {
  return (
    <>
      {actions.map((action) => {
        if (action.isHidden?.(row)) return null;
        const reason = resolveDisabledReason(action.disabledReason?.(row));
        const disabled =
          reason !== undefined || (action.isDisabled?.(row) ?? false);
        // The disabled attribute already blocks activation, so attach the
        // handler only when the action can run.
        const handleClick = disabled
          ? undefined
          : (e: MouseEvent) => {
              e.stopPropagation();
              runRowAction(action, row, confirm, cancelLabel);
            };
        return (
          <button
            key={action.key}
            type="button"
            disabled={disabled}
            title={reason}
            aria-label={action.label}
            data-adapttable-part="action-button"
            data-color={action.color}
            className={classNames.actionButton}
            onClick={handleClick}
          >
            {action.icon ?? action.label}
          </button>
        );
      })}
    </>
  );
}
