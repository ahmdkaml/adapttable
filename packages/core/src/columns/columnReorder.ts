import type { DragEvent, KeyboardEvent } from "react";

/** MIME type carrying the dragged column key during a reorder drag. */
export const COLUMN_DND_MIME = "application/x-adapttable-column";

/** Props that make a whole menu ROW draggable (so the browser's drag image is
 * the full row — you see the column move). Pair with {@link columnDropProps}. */
export interface ColumnRowDragProps {
  draggable: true;
  onDragStart: (event: DragEvent<HTMLElement>) => void;
}

/**
 * Build drag props for a column-menu row. The entire row is the drag handle,
 * matching the native drag-image so the reorder feels physical.
 *
 * @param key - Column key being reordered.
 */
export function columnRowDragProps(key: string): ColumnRowDragProps {
  return {
    draggable: true,
    onDragStart: (event) => {
      // The whole row is draggable so the drag image is the full row — but a
      // drag starting on an interactive control (the eye/pin buttons) would
      // hijack their click. Cancel those so the buttons stay clickable; drags
      // from the grip or the row body still reorder.
      const target = event.target as HTMLElement | null;
      if (target?.closest("button,input,select,a")) {
        event.preventDefault();
        return;
      }
      event.dataTransfer.setData(COLUMN_DND_MIME, key);
      event.dataTransfer.effectAllowed = "move";
    },
  };
}

/** Props for a small, focusable reorder grip — keyboard a11y for the row drag. */
export interface ColumnReorderKeyProps {
  role: "button";
  tabIndex: 0;
  "aria-label": string;
  onKeyDown: (event: KeyboardEvent<HTMLElement>) => void;
}

/**
 * Build keyboard props for the reorder grip. Arrow keys move the column one
 * slot — the accessible equivalent of the pointer drag.
 *
 * @param key - Column key being reordered.
 * @param index - The column's current index in the full order.
 * @param move - Layout mutator that moves a column to a new index.
 * @param label - Accessible label for the grip.
 */
export function columnReorderKeyProps(
  key: string,
  index: number,
  move: (key: string, toIndex: number) => void,
  label: string
): ColumnReorderKeyProps {
  return {
    role: "button",
    tabIndex: 0,
    "aria-label": label,
    onKeyDown: (event) => {
      const back = event.key === "ArrowLeft" || event.key === "ArrowUp";
      const fwd = event.key === "ArrowRight" || event.key === "ArrowDown";
      if (!back && !fwd) return;
      event.preventDefault();
      move(key, back ? index - 1 : index + 1);
    },
  };
}

/** Props for a row that accepts a dropped column, moving it to this index. */
export interface ColumnDropProps {
  onDragOver: (event: DragEvent<HTMLElement>) => void;
  onDrop: (event: DragEvent<HTMLElement>) => void;
}

/**
 * Build drop props for a reorder target: moves the dragged column to this
 * row's `index` on drop.
 *
 * @param index - Target index the dragged column moves to.
 * @param move - Layout mutator that moves a column to a new index.
 */
export function columnDropProps(
  index: number,
  move: (key: string, toIndex: number) => void
): ColumnDropProps {
  return {
    onDragOver: (event) => {
      if (!event.dataTransfer.types.includes(COLUMN_DND_MIME)) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    onDrop: (event) => {
      const key = event.dataTransfer.getData(COLUMN_DND_MIME);
      if (key === "") return;
      event.preventDefault();
      move(key, index);
    },
  };
}
