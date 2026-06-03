import type { KeyboardEvent, PointerEvent } from "react";

/** Minimum column width (px) a resize drag/keyboard step will not go below. */
export const MIN_COLUMN_WIDTH = 60;
/** Keyboard resize step (px) per arrow press. */
export const COLUMN_RESIZE_STEP = 16;

/** Props for a column-resize handle element. */
export interface ColumnResizeHandleProps {
  role: "separator";
  tabIndex: 0;
  "aria-orientation": "vertical";
  "aria-label": string;
  onPointerDown: (event: PointerEvent<HTMLElement>) => void;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/** Current rendered width of the resize handle's owning header cell. */
function cellWidth(handle: HTMLElement): number {
  const cell = handle.closest("th,td");
  return cell ? cell.getBoundingClientRect().width : MIN_COLUMN_WIDTH;
}

/**
 * Build the props for a column-resize handle. Pointer drag resizes live; arrow
 * keys nudge by {@link COLUMN_RESIZE_STEP} for keyboard a11y. Width is measured
 * from the live cell, so columns need no preset width to be resizable.
 *
 * @param key - Column key being resized.
 * @param setWidth - Layout mutator that persists the new width.
 * @param label - Accessible label for the handle.
 */
export function columnResizeHandleProps(
  key: string,
  setWidth: (key: string, width: number) => void,
  label: string
): ColumnResizeHandleProps {
  return {
    role: "separator",
    tabIndex: 0,
    "aria-orientation": "vertical",
    "aria-label": label,
    onPointerDown: (event) => {
      event.preventDefault();
      event.stopPropagation();
      const startX = event.clientX;
      const startWidth = cellWidth(event.currentTarget);
      const onMove = (e: globalThis.PointerEvent) => {
        setWidth(
          key,
          Math.max(MIN_COLUMN_WIDTH, startWidth + e.clientX - startX)
        );
      };
      const onUp = () => {
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    onKeyDown: (event) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      event.preventDefault();
      const current = cellWidth(event.currentTarget);
      const delta =
        event.key === "ArrowLeft" ? -COLUMN_RESIZE_STEP : COLUMN_RESIZE_STEP;
      setWidth(key, Math.max(MIN_COLUMN_WIDTH, current + delta));
    },
  };
}
