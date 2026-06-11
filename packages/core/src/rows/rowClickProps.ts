import type { KeyboardEvent, MouseEvent } from "react";

/** Handlers + affordance for an activatable (clickable) row. */
export interface RowClickProps {
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Clickable rows must be reachable, or Enter activation can never fire. */
  tabIndex: 0;
  style: { cursor: "pointer" };
}

/**
 * True when the event started on an interactive child (button, link, input,
 * checkbox, …) whose own behaviour must win over the row activation — a
 * click on the row-actions button or the selection checkbox is never a
 * navigation.
 */
function fromInteractiveChild(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(
      "button,a,input,select,textarea,label,[role='button'],[role='checkbox']"
    ) !== null
  );
}

/**
 * Build the row-activation props for `onRowClick`: a guarded click handler
 * (interactive children keep their own behaviour), Enter-key activation for
 * keyboard users when the row itself has focus, and the pointer cursor.
 * Returns `undefined` when no handler is configured, so adapters can spread
 * the result unconditionally.
 *
 * @typeParam TRow - The row type.
 * @param row - The row this element renders.
 * @param onRowClick - The caller's activation handler, if any.
 */
export function rowClickProps<TRow>(
  row: TRow,
  onRowClick: ((row: TRow) => void) | undefined
): RowClickProps | undefined {
  if (!onRowClick) return undefined;
  return {
    tabIndex: 0,
    onClick: (event) => {
      if (!fromInteractiveChild(event.target)) onRowClick(row);
    },
    onKeyDown: (event) => {
      if (event.key !== "Enter" || event.target !== event.currentTarget) {
        return;
      }
      event.preventDefault();
      onRowClick(row);
    },
    style: { cursor: "pointer" },
  };
}
