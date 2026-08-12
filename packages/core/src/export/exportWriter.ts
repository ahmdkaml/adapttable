/**
 * What turns a resolved export into a file.
 *
 * Scopes and formats are separate questions. Which rows and columns leave the
 * table is decided once — page, all, selected, the highlighted range, and any
 * column subset — and a **writer** decides what the bytes look like. That split
 * is what lets one scope API serve CSV and XLSX without either format knowing
 * the other exists, and it is why adding a format later costs a writer rather
 * than a second export pipeline.
 *
 * A writer is handed **resolved values**, not rows and columns. Every format
 * would otherwise repeat the same resolution — a column's `exportValue`, then
 * its accessor, then `sortValue` — and the first one to get it slightly wrong
 * would quietly disagree with the others about what the same table contains.
 * Resolving once puts that beyond doubt, and it makes a writer non-generic:
 * `xlsxWriter()` drops into a table of any row type without a type argument.
 *
 * The other reason formats stay separate is weight. CSV is built in, so it
 * lives here. XLSX is a separate entry (`@adapttable/core/xlsx`) that only an
 * app importing it ever downloads — a table that exports CSV must not ship a
 * ZIP encoder.
 */
import type { ColumnDef } from "../types";
import { isBrowser } from "../utils/env";
import { defaultCsvValue, matrixToCsv } from "./csv";

/**
 * An export after the scopes are applied and the cells are resolved: headers,
 * keys, and one row of values per exported row.
 */
export interface ExportTable {
  /** Column headings, in file order. */
  headers: readonly string[];
  /** Column keys, in the same order — for a format that names its fields. */
  keys: readonly string[];
  /** One array of values per row, aligned to `headers`. */
  rows: readonly (readonly unknown[])[];
}

/** What a writer is given: the resolved export, exactly as it will ship. */
export interface ExportWriteContext {
  /** The values to write. */
  table: ExportTable;
  /** The filename the file will be given — for a writer that embeds a title. */
  filename: string;
  /** The CSV formula-injection guard; formats without the flaw ignore it. */
  escapeFormulas?: boolean;
}

/** A built file, ready to hand to the browser. */
export interface ExportPayload {
  /** The content, in the pieces a `Blob` takes. */
  parts: readonly BlobPart[];
  /** MIME type for the download. */
  mimeType: string;
  /**
   * The file as text, for `onAfterExport` and for hosts that keep a copy.
   * Binary formats leave this empty — their bytes are in `parts`.
   */
  text: string;
}

/** A file format the export button can produce. */
export interface ExportWriter {
  /** Extension used when no filename was given, e.g. `"xlsx"`. */
  extension: string;
  /** Build the file from the resolved values. */
  build: (context: ExportWriteContext) => ExportPayload;
}

/**
 * A column's own `exportValue` wins, because it exists precisely to say the
 * file should carry something other than the screen. Without one, the default
 * display-value resolution stands.
 */
function exportCellValue<TRow>(row: TRow, column: ColumnDef<TRow>): unknown {
  return column.exportValue
    ? column.exportValue(row)
    : defaultCsvValue(row, column);
}

/**
 * Resolve rows and columns into the values a file carries.
 *
 * Values keep their type — a number stays a number — because a format that can
 * express one should say so, and text is a lossy last resort rather than the
 * only option.
 *
 * @typeParam TRow - The row type.
 * @param rows - The rows a scope resolved to, in table order.
 * @param columns - The columns a scope resolved to, in file order.
 * @returns The resolved table a writer receives.
 */
export function buildExportTable<TRow>(
  rows: readonly TRow[],
  columns: readonly ColumnDef<TRow>[]
): ExportTable {
  return {
    headers: columns.map((column) =>
      typeof column.header === "string" ? column.header : column.key
    ),
    keys: columns.map((column) => column.key),
    rows: rows.map((row) =>
      columns.map((column) => exportCellValue(row, column))
    ),
  };
}

/** The UTF-8 byte-order mark, which is what makes Excel read the file as UTF-8. */
const BOM = "\uFEFF";

/**
 * The built-in writer: comma-separated text, UTF-8 with a BOM so Excel opens
 * unicode correctly. This is what the export button uses when no writer is
 * given.
 */
export const csvWriter: ExportWriter = {
  extension: "csv",
  build: ({ table, escapeFormulas }) => {
    const text = matrixToCsv(table, { escapeFormulas });
    return { parts: [BOM, text], mimeType: "text/csv;charset=utf-8", text };
  },
};

/** `"export.xlsx"` — the name when the caller did not choose one. */
export function defaultExportFilename(writer: ExportWriter): string {
  return `export.${writer.extension}`;
}

/**
 * Hand a built file to the browser. No-op outside it, so a server render that
 * reaches this does nothing rather than throwing.
 *
 * @param filename - Download name, e.g. `"people.xlsx"`.
 * @param payload - The file from {@link ExportWriter.build}.
 */
export function downloadExportFile(
  filename: string,
  payload: ExportPayload
): void {
  if (!isBrowser()) return;
  const blob = new Blob([...payload.parts], { type: payload.mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
