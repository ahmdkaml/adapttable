/**
 * Clipboard text, turned into ordinary cell edits.
 *
 * Paste is deliberately NOT its own commit path. It parses what a spreadsheet
 * put on the clipboard, maps it onto the selection, and hands back the same
 * edits an inline edit produces — same `parseValue`, same shape, same host
 * handler. Anything later added to that path (validation, async save states,
 * conflict handling) applies to a paste without paste knowing it exists, which
 * is what stops this becoming a second half-maintained editing route.
 *
 * The parsing follows what Excel, Google Sheets, Numbers and LibreOffice write:
 * tab-separated fields, newline-separated rows, and RFC-4180 quoting when a
 * field carries a tab, a newline or a quote.
 */
import type { ColumnDef } from "../types";
import { type CellRange, cellRangeBounds } from "./cellRange";

/** One edit a paste produces — exactly what an inline commit produces. */
export interface PasteEdit<TRow> {
  /** The row being written. */
  row: TRow;
  /** Which column, by key. */
  columnKey: string;
  /** The value to commit, already through the column's `parseValue`. */
  value: unknown;
}

/**
 * Parse clipboard text into a grid of raw strings.
 *
 * Quoted fields keep their tabs and newlines: a spreadsheet writes `"a\tb"` for
 * a cell containing a tab, and splitting naively would turn one cell into two
 * and shift every column after it.
 *
 * @param text - The clipboard's text.
 * @returns Rows of raw cell strings; empty when there is nothing to paste.
 */
export function parseClipboardTable(text: string): string[][] {
  if (text === "") return [];
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (ch === '"' && field === "") {
      const quoted = readQuotedField(text, i + 1);
      field = quoted.value;
      i = quoted.next;
    } else if (ch === "\t") {
      row.push(field);
      field = "";
      i++;
    } else if (ch === "\n" || ch === "\r") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
      // CRLF is one break, not two: counting it twice pastes a blank row.
      i += ch === "\r" && text[i + 1] === "\n" ? 2 : 1;
    } else {
      field += ch;
      i++;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

/**
 * Read one quoted field, starting just past its opening quote.
 *
 * @param text - The whole clipboard text.
 * @param start - Index of the first character inside the quotes.
 * @returns The field's value and the index just past its closing quote.
 */
function readQuotedField(
  text: string,
  start: number
): { value: string; next: number } {
  let value = "";
  let i = start;
  while (i < text.length) {
    if (text[i] !== '"') {
      value += text[i];
      i++;
    } else if (text[i + 1] === '"') {
      // A doubled quote is one literal quote; a lone one closes the field.
      value += '"';
      i += 2;
    } else return { value, next: i + 1 };
  }
  // Unterminated — a truncated clipboard is still worth what it carries.
  return { value, next: i };
}

/** What a paste needs to know to become edits. */
export interface PasteRangeOptions<TRow> {
  /** The clipboard's text. */
  text: string;
  /** Where the paste starts — its top-left cell is the anchor. */
  range: CellRange;
  /** The rows the browser holds, in table order. */
  rows: readonly TRow[];
  /** The columns as rendered — a range's column indices address these. */
  columns: readonly ColumnDef<TRow>[];
  /** Where the rendered window starts in the dataset. Zero unless paged. */
  firstRowIndex?: number;
}

/**
 * Turn clipboard text into the edits it implies, starting at the selection's
 * top-left cell.
 *
 * The clipboard's shape wins over the selection's: pasting a 3×2 block into a
 * single selected cell writes 3×2, which is what every spreadsheet does. Cells
 * falling outside the loaded rows or the rendered columns are dropped rather
 * than invented — a paste must never write into a row the browser has not got.
 *
 * A column that is not editable is skipped: paste is an edit, and an edit into a
 * read-only column is not one.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link PasteRangeOptions}.
 * @returns The edits, in row-major order.
 */
export function pasteRangeEdits<TRow>(
  options: PasteRangeOptions<TRow>
): PasteEdit<TRow>[] {
  const { text, range, rows, columns, firstRowIndex = 0 } = options;
  const grid = parseClipboardTable(text);
  if (grid.length === 0) return [];

  const start = cellRangeBounds(range);
  const edits: PasteEdit<TRow>[] = [];

  grid.forEach((line, r) => {
    const row = rows[start.fromRow + r - firstRowIndex];
    if (row === undefined) return;
    line.forEach((raw, c) => {
      const column = columns[start.fromCol + c];
      if (!column) return;
      const editable =
        typeof column.editable === "function"
          ? column.editable(row)
          : column.editable === true;
      if (!editable) return;
      edits.push({
        row,
        columnKey: column.key,
        // The column's own parser, so a paste commits what typing would.
        value: column.parseValue ? column.parseValue(raw, row) : raw,
      });
    });
  });
  return edits;
}

/** The two ways a table can receive a paste. */
export interface CellPasteHandlerOptions<TRow> {
  /** Takes the batch whole — one transaction, one undo entry. */
  onCellPaste?: (edits: PasteEdit<TRow>[]) => void;
  /** The ordinary inline-edit channel, used one edit at a time. */
  onCellEdit?: (row: TRow, key: string, nextValue: unknown) => void;
}

/**
 * Resolve who receives a paste.
 *
 * A table that can already be edited can already be pasted into: with no
 * `onCellPaste`, each edit goes through `onCellEdit`, the exact call an inline
 * commit makes. `onCellPaste` exists for hosts that want the batch whole —
 * one server round trip, one undo entry — and takes precedence when given.
 *
 * @typeParam TRow - The row type.
 * @param options - See {@link CellPasteHandlerOptions}.
 * @returns The handler, or `undefined` when the table takes no edits at all —
 *   which leaves Ctrl/Cmd+V to the browser.
 */
export function cellPasteHandler<TRow>(
  options: CellPasteHandlerOptions<TRow>
): ((edits: PasteEdit<TRow>[]) => void) | undefined {
  const { onCellPaste, onCellEdit } = options;
  if (onCellPaste) return onCellPaste;
  if (!onCellEdit) return undefined;
  return (edits) => {
    for (const edit of edits) onCellEdit(edit.row, edit.columnKey, edit.value);
  };
}
