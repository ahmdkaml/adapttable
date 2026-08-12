/**
 * Keyboard navigation over table cells — the stateful half.
 *
 * Opt-in: without `cellNavigation` this hook is never called, and the table
 * renders exactly the markup it always did. With it, the table becomes one tab
 * stop whose interior is reachable by arrow keys, which is the difference
 * between a 10,000-row table being usable from a keyboard and being a trap.
 *
 * Three things here are easy to get wrong and are the reason this lives in core
 * rather than in eight adapters:
 *
 * **The ARIA indices are absolute.** `aria-rowindex` counts within the dataset,
 * not within the rendered window. Virtualization mounts 24 rows out of 100,000,
 * so a naive implementation numbers them 1-24 and every assistive technology
 * reports "row 3 of 24" while the user is at row 40,000. `aria-rowcount` and
 * `aria-colcount` carry the totals for the same reason.
 *
 * **A cell the virtualizer has not mounted still has to be reachable.**
 * Ctrl+End on a 100,000-row table asks for a cell that does not exist in the
 * DOM. Moving focus there means scrolling it into existence first, then
 * focusing it once it mounts — which is asynchronous, so the hook holds a
 * pending address and focuses on the render that produces the element.
 *
 * **Focus lives in state, but the DOM has to follow it.** Setting
 * `tabIndex` alone moves nothing; something must call `.focus()`. That happens
 * in an effect keyed on the active address, addressing cells by their
 * `data-grid-cell` attribute so the mechanism does not need a ref per cell —
 * with 100,000 rows, a ref map is a leak with extra steps.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { columnText } from "../columns/columnText";
import { useEventCallback } from "../hooks/useEventCallback";
import type { ColumnDef, Direction, TableLabels } from "../types";
import {
  type CellRange,
  cellRangeBounds,
  cellRangeSize,
  extendCellRange,
  isInCellRange,
  isSingleCell,
  singleCellRange,
} from "./cellRange";
import {
  clipboardRangeText,
  readClipboardText,
  writeClipboardText,
} from "./clipboardRange";
import {
  type GridBounds,
  type GridCell,
  gridFocusMoveForKey,
  moveGridFocus,
  sameGridCell,
} from "./gridFocus";
import { type PasteEdit, pasteRangeEdits } from "./pasteRange";

/** The attribute a focusable cell carries, so focus can find it in the DOM. */
export const GRID_CELL_ATTR = "data-grid-cell";

/** `data-grid-cell` value for one address — `"row:col"`, both absolute. */
export function gridCellAttr(cell: GridCell): string {
  return `${cell.row}:${cell.col}`;
}

/** Options for {@link useGridFocus}. */
export interface UseGridFocusOptions<TRow> {
  /** Off unless the host asked for it; when false the hook does nothing. */
  enabled: boolean;
  /**
   * Rows in the whole dataset. This is the ARIA number — `aria-rowcount` — and
   * deliberately NOT what movement is clamped to; see the note on navigable
   * bounds below.
   */
  rowCount: number;
  /** Columns in the order they are rendered. */
  columns: readonly ColumnDef<TRow>[];
  /** The rendered rows, for reading a cell's text when focus lands. */
  rows: readonly TRow[];
  /**
   * Where the rendered window starts in the dataset. Zero without
   * virtualization; with it, `rows[i]` is dataset row `firstRowIndex + i`.
   */
  firstRowIndex?: number;
  /** Rows a PageUp/PageDown travels. Defaults to the rendered row count. */
  pageSize?: number;
  /** Text direction — flips the left/right arrows. */
  dir?: Direction;
  /** Announcement strings; falls back to the built-in English. */
  labels?: TableLabels;
  /**
   * Bring a dataset row into view. Supplied by the virtualizer; without it a
   * move to an unmounted row cannot be completed and is left alone rather than
   * silently dropping focus.
   */
  scrollToRow?: (rowIndex: number) => void;
  /** Enter or F2 on a cell — the editing model's entry point. */
  onActivate?: (cell: GridCell) => void;
  /**
   * Fired whenever the selected range changes, including when it collapses to
   * a single cell. `null` means nothing is selected.
   */
  onRangeChange?: (range: CellRange | null) => void;
  /**
   * Ctrl/Cmd+X after the copy succeeded. The table never clears data itself —
   * what "cut" removes is the host's decision, and a cut that emptied cells
   * before the clipboard accepted them would lose them outright.
   */
  onCut?: (range: CellRange) => void;
  /**
   * Ctrl/Cmd+V, with the clipboard already parsed into ordinary cell edits.
   *
   * Paste is not a second commit path: these are the same edits an inline edit
   * produces, so validation or async saving added to that path covers a paste
   * without paste knowing. Applying them stays the host's job — the table never
   * writes to data it does not own.
   */
  onPaste?: (edits: PasteEdit<TRow>[]) => void;
}

/** What {@link useGridFocus} returns. */
export interface GridFocusState {
  /**
   * Whether cell navigation is on. Consumers render the live region only when
   * it is: an `aria-live` region that appears at the same moment as its text is
   * frequently missed by screen readers, so it has to exist beforehand — and
   * must not exist at all when the feature is off.
   */
  enabled: boolean;
  /** The focused cell, or `null` before the grid has been entered. */
  active: GridCell | null;
  /** Props for the grid container: role, dimensions, key handling. */
  getGridProps: () => Record<string, unknown>;
  /** Props for one cell — roving `tabIndex`, absolute indices, the hook. */
  getCellProps: (cell: GridCell) => Record<string, unknown>;
  /** Props for one row: its absolute `aria-rowindex`. */
  getRowProps: (rowIndex: number) => Record<string, unknown>;
  /**
   * Props for a cell addressed by its position in the RENDERED window — which
   * is the index an adapter already has, whether it is mapping `source.rows` or
   * a virtual entry.
   *
   * The conversion to an absolute address lives here rather than in eight
   * adapters, because getting it wrong is invisible: the table looks right and
   * only a screen reader announces the wrong row.
   */
  getCellPropsAt: (windowIndex: number, col: number) => Record<string, unknown>;
  /** Props for a row addressed by its position in the rendered window. */
  getRowPropsAt: (windowIndex: number) => Record<string, unknown>;
  /** Live-region text naming where focus is. Empty until focus moves. */
  announcement: string;
  /** The selected rectangle, or `null` when nothing is selected. */
  range: CellRange | null;
  /** Select a rectangle programmatically — what a Select-all would call. */
  selectRange: (range: CellRange | null) => void;
  /**
   * Props for a column header that selects its whole column on click, with
   * Ctrl/Cmd+click extending the current selection instead of replacing it.
   */
  getColumnHeaderProps: (
    col: number,
    options?: { sortable?: boolean }
  ) => Record<string, unknown>;
  /**
   * Select a whole column by index — the loaded rows of it, since a column of
   * 100,000 rows cannot be selected while 500 are in hand.
   */
  selectColumn: (col: number, extend?: boolean) => void;
  /** Move focus programmatically — the fill handle and clipboard will need it. */
  focusCell: (cell: GridCell) => void;
}

/**
 * Keyboard focus over the cell grid.
 *
 * @typeParam TRow - The row type.
 */
export function useGridFocus<TRow>(
  options: UseGridFocusOptions<TRow>
): GridFocusState {
  const {
    enabled,
    rowCount,
    columns,
    rows,
    firstRowIndex = 0,
    pageSize,
    dir = "ltr",
    labels,
    scrollToRow,
    onActivate,
    onRangeChange,
    onCut,
    onPaste,
  } = options;

  const [active, setActive] = useState<GridCell | null>(null);
  const [range, setRange] = useState<CellRange | null>(null);
  // A move can outrun the DOM: the target row may not be mounted yet. This
  // holds the address until a render produces its element.
  const pending = useRef<GridCell | null>(null);
  const container = useRef<HTMLElement | null>(null);
  const [announcement, setAnnouncement] = useState("");
  // A drag in progress. Held in a ref rather than state because it changes on
  // every pointer move and must not re-render the grid to be read.
  const dragging = useRef(false);

  // Movement is clamped to the LOADED window, not the dataset.
  //
  // `aria-rowcount` says 100,000 because that is true and a screen reader needs
  // it. But Ctrl+End must not move to row 100,000 when only rows 1-25 are
  // loaded: on a paged table that row is on another page, and on a virtualized
  // one it may not be fetched. Moving there announces a cell the user cannot see
  // and strands DOM focus behind — exactly what the Ant Design demo did in a
  // browser before this existed. Virtualization still reaches every loaded row,
  // because `scrollToRow` mounts it and the window grows as more arrives.
  const lastLoadedRow = firstRowIndex + Math.max(0, rows.length - 1);
  const bounds = useMemo<GridBounds>(
    () => ({
      rowCount: lastLoadedRow + 1,
      colCount: columns.length,
      pageSize: pageSize ?? Math.max(1, rows.length),
    }),
    [lastLoadedRow, columns.length, pageSize, rows.length]
  );

  /** Say where focus landed: the column, then the cell, then the position. */
  const announce = useCallback(
    (cell: GridCell) => {
      const column = columns[cell.col];
      if (!column) return;
      const row = rows[cell.row - firstRowIndex];
      const header =
        typeof column.header === "string" ? column.header : column.key;
      const value = row === undefined ? "" : columnText(column, row);
      const position = (labels?.gridCellPosition ?? defaultPosition)(
        cell.row + 1,
        rowCount
      );
      setAnnouncement(
        value ? `${header}, ${value}, ${position}` : `${header}, ${position}`
      );
    },
    [columns, rows, firstRowIndex, labels, rowCount]
  );

  const selectRange = useCallback(
    (next: CellRange | null) => {
      setRange(next);
      onRangeChange?.(next);
      // Say what was selected, not just where focus is. A single cell says
      // nothing: its own announcement already names it, and repeating "1 cell"
      // on every arrow press turns navigation into noise.
      if (!next || isSingleCell(next)) return;
      const b = cellRangeBounds(next);
      setAnnouncement(
        (labels?.gridRangeSelection ?? defaultRangeSelection)({
          fromRow: b.fromRow + 1,
          toRow: b.toRow + 1,
          fromColumn: b.fromCol + 1,
          toColumn: b.toCol + 1,
          cells: cellRangeSize(next),
        })
      );
    },
    [onRangeChange, labels]
  );

  const focusCell = useCallback(
    (cell: GridCell) => {
      setActive(cell);
      pending.current = cell;
      // Ask the virtualizer for the row before trying to focus it; if it is
      // already mounted this is a no-op and the effect below focuses at once.
      scrollToRow?.(cell.row);
      announce(cell);
    },
    [scrollToRow, announce]
  );

  // Move the DOM to wherever state says focus is. Keyed on the address AND on
  // the rendered rows, so a cell that arrives from a scroll gets focused on the
  // render that mounts it rather than being lost.
  useEffect(() => {
    if (!enabled) return;
    const target = pending.current;
    if (!target || !container.current) return;
    const element = container.current.querySelector<HTMLElement>(
      `[${GRID_CELL_ATTR}="${gridCellAttr(target)}"]`
    );
    if (!element) return;
    pending.current = null;
    element.focus();
  }, [enabled, active, rows, firstRowIndex]);

  const onKeyDown = useEventCallback(
    (event: {
      key: string;
      ctrlKey?: boolean;
      metaKey?: boolean;
      shiftKey?: boolean;
      preventDefault: () => void;
    }) => {
      if (!enabled) return;
      const from = active ?? { row: firstRowIndex, col: 0 };

      // Enter and F2 belong to whatever is inside the cell — `EditableCellGate`
      // handles both on the element focus just landed on. This only fires when a
      // host asked for its own activation, and stays out of the way otherwise so
      // the two never race for one key press.
      // Copy and cut the selection the way a spreadsheet does. Handled before
      // movement so the modifier never doubles as a navigation key, and only
      // when a rectangle exists — otherwise the browser's own copy stands.
      const modifier = event.ctrlKey === true || event.metaKey === true;
      if (modifier && (event.key === "c" || event.key === "x")) {
        if (!range) return;
        event.preventDefault();
        const text = clipboardRangeText({
          range,
          rows,
          columns,
          firstRowIndex,
        });
        void writeClipboardText(text).then((ok) => {
          setAnnouncement(
            ok
              ? (labels?.gridRangeCopied ?? defaultRangeCopied)(
                  cellRangeSize(range)
                )
              : (labels?.gridRangeCopyFailed ?? "Copy failed")
          );
          if (ok && event.key === "x") onCut?.(range);
        });
        return;
      }

      // Paste needs a destination, not a rectangle: a spreadsheet pastes into
      // the focused cell and lets the clipboard's own shape decide the rest, so
      // this takes the same `from` the movement keys take rather than demanding
      // a selection first.
      if (modifier && event.key === "v" && onPaste) {
        const target = range ?? singleCellRange(from);
        event.preventDefault();
        void readClipboardText().then((text) => {
          if (text === null) {
            setAnnouncement(labels?.gridRangePasteFailed ?? "Paste failed");
            return;
          }
          const edits = pasteRangeEdits({
            text,
            range: target,
            rows,
            columns,
            firstRowIndex,
          });
          onPaste(edits);
          setAnnouncement(
            (labels?.gridRangePasted ?? defaultRangePasted)(edits.length)
          );
        });
        return;
      }

      if (event.key === "Enter" || event.key === "F2") {
        if (onActivate) {
          event.preventDefault();
          onActivate(from);
        }
        return;
      }

      const move = gridFocusMoveForKey(event, dir);
      if (!move) return;
      const moved = moveGridFocus(from, move, bounds);
      // The window may not start at row 0 (page 3 of a paged table) and the
      // mover clamps at zero, so hold that floor here too.
      const next = { row: Math.max(moved.row, firstRowIndex), col: moved.col };
      // An edge move resolves to the same cell: swallow the key so the page
      // does not scroll, but say nothing — nothing changed.
      event.preventDefault();
      if (sameGridCell(next, active)) return;

      // Focus first, then the selection: both write the live region, and for a
      // Shift move the RANGE is the news while for a plain move the cell is.
      // Whichever runs last wins, so the order encodes which one matters.
      focusCell(next);
      if (event.shiftKey === true) {
        // Shift extends from wherever the selection began, so pressing
        // Shift+Down twice then Shift+Up shrinks the range rather than starting
        // a new one upward. `from` is the fallback anchor for the first press.
        selectRange(extendCellRange(range, next, from));
      } else {
        // A plain move collapses any selection to the cell landed on, which is
        // what every grid does and what stops a stale rectangle lingering.
        selectRange(singleCellRange(next));
      }
    }
  );

  // A pointer released outside the table would otherwise leave the drag armed,
  // so the next hover over any cell would extend a selection nobody started.
  useEffect(() => {
    if (!enabled) return undefined;
    const end = () => {
      dragging.current = false;
    };
    window.addEventListener("mouseup", end);
    return () => window.removeEventListener("mouseup", end);
  }, [enabled]);

  const getGridProps = useCallback(() => {
    if (!enabled) return {};
    return {
      role: "grid",
      "aria-rowcount": rowCount,
      "aria-colcount": columns.length,
      onKeyDown,
      ref: (node: HTMLElement | null) => {
        container.current = node;
      },
    };
  }, [enabled, rowCount, columns.length, onKeyDown]);

  const getCellProps = useCallback(
    (cell: GridCell) => {
      if (!enabled) return {};
      const isActive = sameGridCell(cell, active);
      // Exactly one cell is tabbable. Before the grid has ever been entered
      // that is its first cell, so Tab reaches the table at all.
      const firstEver =
        active === null && cell.row === firstRowIndex && cell.col === 0;
      const selected = isInCellRange(range, cell);
      return {
        [GRID_CELL_ATTR]: gridCellAttr(cell),
        tabIndex: isActive || firstEver ? 0 : -1,
        "aria-colindex": cell.col + 1,
        // Only meaningful once a real rectangle exists: marking every focused
        // cell as selected would tell a screen reader the table is in selection
        // mode when the user has merely arrowed around.
        "aria-selected": range && !isSingleCell(range) ? selected : undefined,
        "data-cell-selected": selected ? "" : undefined,
        onMouseDown: (event: { shiftKey?: boolean }) => {
          if (event.shiftKey === true) {
            selectRange(extendCellRange(range, cell, active ?? cell));
          } else {
            // A press with no modifier starts a drag AND collapses to this
            // cell: dragging away extends from here, releasing without moving
            // leaves the single-cell selection a plain click should give.
            dragging.current = true;
            selectRange(singleCellRange(cell));
          }
        },
        onMouseEnter: () => {
          // Extending on ENTER rather than on move means one update per cell
          // crossed instead of one per pixel.
          if (!dragging.current) return;
          selectRange(extendCellRange(range, cell, active ?? cell));
        },
        onMouseUp: () => {
          dragging.current = false;
        },
        onFocus: () => {
          // A mouse click or a screen reader can move focus without a key
          // press; keep state in step rather than fighting it.
          if (!sameGridCell(cell, active)) setActive(cell);
        },
      };
    },
    [enabled, active, firstRowIndex, range, selectRange]
  );

  /**
   * Select an entire column — what a header click and Ctrl/Cmd+click do.
   *
   * The rectangle spans the LOADED rows, the same bound movement obeys: a column
   * of 100,000 rows cannot be selected when only 500 are in hand, and claiming
   * otherwise would export or copy rows the browser has never seen.
   */
  const selectColumn = useCallback(
    (col: number, extend = false) => {
      const top = { row: firstRowIndex, col };
      const bottom = { row: lastLoadedRow, col };
      selectRange(
        extend && range
          ? extendCellRange(range, bottom, range.anchor)
          : { anchor: top, head: bottom }
      );
      focusCell(top);
    },
    [firstRowIndex, lastLoadedRow, range, selectRange, focusCell]
  );

  /** Props for a column header that selects its column when clicked. */
  const getColumnHeaderProps = useCallback(
    (col: number, options?: { sortable?: boolean }) => {
      if (!enabled) return {};
      return {
        onClick: (event: { ctrlKey?: boolean; metaKey?: boolean }) => {
          const modified = event.ctrlKey === true || event.metaKey === true;
          // A sortable header's plain click already sorts, and the two cannot
          // share it without one breaking. Ctrl/Cmd+click selects anywhere; a
          // plain click selects only where nothing else claims it.
          if (!modified && options?.sortable === true) return;
          selectColumn(col, modified);
        },
      };
    },
    [enabled, selectColumn]
  );

  const getRowProps = useCallback(
    (rowIndex: number) => (enabled ? { "aria-rowindex": rowIndex + 1 } : {}),
    [enabled]
  );

  const getCellPropsAt = useCallback(
    (windowIndex: number, col: number) =>
      getCellProps({ row: firstRowIndex + windowIndex, col }),
    [getCellProps, firstRowIndex]
  );

  const getRowPropsAt = useCallback(
    (windowIndex: number) => getRowProps(firstRowIndex + windowIndex),
    [getRowProps, firstRowIndex]
  );

  // Memoized as a whole. A fresh object each render is not a cosmetic problem:
  // an adapter that memoizes on this state — antd derives its `components.table`
  // from it — would rebuild that derivation every render, remount the table, and
  // destroy the focus this hook just placed. Found exactly that way in a browser.
  return useMemo(
    () => ({
      enabled,
      active: enabled ? active : null,
      getGridProps,
      getCellProps,
      getRowProps,
      getCellPropsAt,
      getRowPropsAt,
      announcement: enabled ? announcement : "",
      range: enabled ? range : null,
      selectRange,
      selectColumn,
      getColumnHeaderProps,
      focusCell,
    }),
    [
      enabled,
      active,
      getGridProps,
      getCellProps,
      getRowProps,
      getCellPropsAt,
      getRowPropsAt,
      announcement,
      range,
      selectRange,
      selectColumn,
      getColumnHeaderProps,
      focusCell,
    ]
  );
}

/** "selected rows 3 to 7, columns 2 to 4, 15 cells" — replaceable via labels. */
function defaultRangeSelection({
  fromRow,
  toRow,
  fromColumn,
  toColumn,
  cells,
}: {
  fromRow: number;
  toRow: number;
  fromColumn: number;
  toColumn: number;
  cells: number;
}): string {
  return `selected rows ${fromRow} to ${toRow}, columns ${fromColumn} to ${toColumn}, ${cells} cells`;
}

/** "12 cells copied" — replaceable through `labels.gridRangeCopied`. */
function defaultRangeCopied(cells: number): string {
  return `${cells} cells copied`;
}

/** "12 cells pasted" — replaceable through `labels.gridRangePasted`. */
function defaultRangePasted(cells: number): string {
  return `${cells} cells pasted`;
}

/** "row 41 of 10,000" — replaceable through `labels.gridCellPosition`. */
function defaultPosition(row: number, total: number): string {
  return `row ${row} of ${total}`;
}
