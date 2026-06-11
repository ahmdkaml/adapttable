import type { KeyboardEvent, MouseEvent } from "react";

/** Handlers + affordance for an activatable (clickable) row. */
export interface RowClickProps {
  onClick: (event: MouseEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
  /** Clickable rows must be reachable, or Enter activation can never fire. */
  tabIndex: 0;
  /** Marks the element as an arrow-key navigation stop among its siblings. */
  "data-adapttable-row": "";
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
 * Move focus to the previous/next sibling row (any element carrying the
 * `data-adapttable-row` stop marker under the same parent — `<tr>`s in a
 * tbody and mobile cards in a list alike). No wrap-around: the edges are a
 * natural stop, matching native listbox behaviour.
 */
function moveRowFocus(current: HTMLElement, delta: -1 | 1): void {
  const parent = current.parentElement;
  if (!parent) return;
  const stops = [...parent.children].filter(
    (el): el is HTMLElement =>
      el instanceof HTMLElement && el.hasAttribute("data-adapttable-row")
  );
  const next = stops[stops.indexOf(current) + delta];
  next?.focus();
}

/**
 * Build the row-activation props for `onRowClick`: a guarded click handler
 * (interactive children keep their own behaviour), Enter-key activation
 * when the row itself has focus, ArrowUp/ArrowDown roving focus across the
 * sibling rows, and the pointer cursor. Returns `undefined` when no handler
 * is configured, so adapters can spread the result unconditionally.
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
    "data-adapttable-row": "",
    onClick: (event) => {
      if (!fromInteractiveChild(event.target)) onRowClick(row);
    },
    onKeyDown: (event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "Enter") {
        event.preventDefault();
        onRowClick(row);
        return;
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        moveRowFocus(event.currentTarget, event.key === "ArrowDown" ? 1 : -1);
      }
    },
    style: { cursor: "pointer" },
  };
}
