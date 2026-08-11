import { ACTIONS_COLUMN_KEY } from "../columns/columnMenuModel";
import type { TableSource } from "../source/TableSource";
import type { ColumnDef } from "../types";
import { devWarn } from "../utils/devWarn";
import { defaultCsvValue, downloadCsv, rowsToCsv } from "./csv";

/** Which rows an export covers. */
export type ExportRowScope = "page" | "all" | "selected";

/**
 * Which columns an export covers: what the user can see, every defined
 * column, or an explicit list of keys in file order.
 */
export type ExportColumnScope = "visible" | "all" | readonly string[];

/** Opt-in CSV export config for the shared DataTable surface. */
export interface ExportCsvOptions<TRow = unknown> {
  /** Download filename. Defaults to `"export.csv"`. */
  filename?: string;
  /**
   * Which rows the file contains.
   *
   * `"page"` (default) — current page / loaded slice.
   * `"all"` — full filtered+sorted set when the source exposes
   * {@link TableSource.allFilteredRows}; otherwise falls back to the
   * page with a dev-only warning.
   * `"selected"` — the checked rows, in table order. Selection is a set of
   * ids, so this searches the widest set the source can offer: a row selected
   * on page 1 is still exported while page 3 is on screen.
   */
  scope?: ExportRowScope;
  /**
   * Which columns the file contains.
   *
   * `"visible"` (default) — what the user can see, so the file matches the
   * screen. `"all"` — every defined column including those hidden through the
   * column menu, for a complete extract. An explicit array picks columns by
   * key, in the order given, and silently ignores a key that matches no
   * column so a stale saved config cannot break the button.
   *
   * The synthetic actions column is never exported under any of them.
   */
  columns?: ExportColumnScope;
  /**
   * Neutralise spreadsheet formula injection (see
   * {@link RowsToCsvOptions.escapeFormulas}). Disable ONLY for
   * machine-consumed output that is never opened in a spreadsheet.
   * @defaultValue true
   */
  escapeFormulas?: boolean;
  /**
   * Runs after the rows and columns are chosen and before the file is
   * written, which is the only moment where both are known and nothing has
   * happened yet.
   *
   * Return `false` to cancel the export — enough is known here to decide
   * (too many rows, nothing selected, a permission the host enforces).
   * Return `{ filename }` to name the file from the data, which is what most
   * callers want it for. Return nothing to continue unchanged.
   */
  onBeforeExport?: (
    info: ExportInfo<TRow>
  ) => boolean | void | { filename?: string };
  /**
   * Runs once the file has been handed to the browser, with the text that was
   * written. For analytics, a toast, or keeping a copy.
   */
  onAfterExport?: (info: ExportInfo<TRow> & { csv: string }) => void;
}

/** What an export lifecycle hook is told about the file being written. */
export interface ExportInfo<TRow> {
  /** The rows the chosen scope resolved to, in table order. */
  rows: readonly TRow[];
  /** The columns the chosen scope resolved to, in file order. */
  columns: readonly ColumnDef<TRow>[];
  /** The filename as it stands, before any override this hook returns. */
  filename: string;
}

/** Resolve a boolean-or-options prop into a concrete config, or `null` when off. */
export function resolveExportCsv<TRow = unknown>(
  value: boolean | ExportCsvOptions<TRow> | undefined
): ExportCsvOptions<TRow> | null {
  if (!value) return null;
  if (value === true) return {};
  return value;
}

/** Columns that belong in a CSV (drop the synthetic actions column). */
export function exportableColumns<TRow>(
  columns: readonly ColumnDef<TRow>[]
): ColumnDef<TRow>[] {
  return columns.filter((column) => column.key !== ACTIONS_COLUMN_KEY);
}

/**
 * Everything an export needs beyond the visible columns: the selection to
 * honour a `"selected"` scope, and the full column set to honour `"all"`.
 *
 * Every field is optional. A caller that passes none gets exactly the
 * behaviour this function always had.
 */
export interface ExportContext<TRow> {
  /** The checked row ids. */
  selectedIds?: ReadonlySet<string>;
  /** How a row's id is derived — the table's own `getRowId`. */
  getRowId?: (row: TRow) => string;
  /** Every defined column, including any hidden through the column menu. */
  allColumns?: readonly ColumnDef<TRow>[];
}

/** Pick the column set an export scope asks for, minus the actions column. */
export function resolveExportColumns<TRow>(
  scope: ExportColumnScope | undefined,
  visible: readonly ColumnDef<TRow>[],
  all: readonly ColumnDef<TRow>[] | undefined
): ColumnDef<TRow>[] {
  const keys: readonly string[] | undefined =
    typeof scope === "string" || scope === undefined ? undefined : scope;
  const pool = exportableColumns(
    scope === "all" || keys ? (all ?? visible) : visible
  );
  if (!keys) return pool;
  // Order follows the caller's list, not the table's, because an explicit
  // list is a statement about the file's shape.
  const byKey = new Map(pool.map((column) => [column.key, column]));
  return keys.flatMap((key) => {
    const column = byKey.get(key);
    return column ? [column] : [];
  });
}

/** The rows a scope asks for, in table order. */
function resolveExportRows<TRow>(
  scope: ExportRowScope,
  source: TableSource<TRow>,
  context: ExportContext<TRow> | undefined
): readonly TRow[] {
  if (scope === "page") return source.rows;
  if (scope === "all") {
    if (!source.allFilteredRows) {
      devWarn(
        'exportCsv scope "all" is only supported on the frontend data tier (in-memory rows with allFilteredRows). Server-paginated sources cannot rebuild the full set; exporting the current page instead.'
      );
    }
    return source.allFilteredRows ?? source.rows;
  }
  const { selectedIds, getRowId } = context ?? {};
  if (!selectedIds || !getRowId) {
    devWarn(
      'exportCsv scope "selected" needs the table\'s selection. Adapters pass it automatically; a hand-built call must supply `selectedIds` and `getRowId`. Exporting the current page instead.'
    );
    return source.rows;
  }
  // Search the widest set available, so a row checked on an earlier page is
  // still in the file when a later page is on screen.
  const searchable = source.allFilteredRows ?? source.rows;
  return searchable.filter((row) => selectedIds.has(getRowId(row)));
}

/**
 * Build CSV text for the chosen row and column scopes.
 *
 * @typeParam TRow - The row type.
 */
export function buildTableCsv<TRow>(options: {
  source: TableSource<TRow>;
  columns: readonly ColumnDef<TRow>[];
  scope?: ExportRowScope;
  columnScope?: ExportColumnScope;
  escapeFormulas?: boolean;
  context?: ExportContext<TRow>;
}): string {
  const rows = resolveExportRows(
    options.scope ?? "page",
    options.source,
    options.context
  );
  const columns = resolveExportColumns(
    options.columnScope ?? "visible",
    options.columns,
    options.context?.allColumns
  );
  return rowsToCsv(rows, columns, {
    escapeFormulas: options.escapeFormulas,
    getValue: exportCellValue,
  });
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
 * Build + download a CSV for the current table view.
 *
 * @typeParam TRow - The row type.
 */
export function downloadTableCsv<TRow>(options: {
  source: TableSource<TRow>;
  columns: readonly ColumnDef<TRow>[];
  filename?: string;
  scope?: ExportRowScope;
  columnScope?: ExportColumnScope;
  escapeFormulas?: boolean;
  context?: ExportContext<TRow>;
  onBeforeExport?: ExportCsvOptions<TRow>["onBeforeExport"];
  onAfterExport?: ExportCsvOptions<TRow>["onAfterExport"];
}): void {
  const rows = resolveExportRows(
    options.scope ?? "page",
    options.source,
    options.context
  );
  const columns = resolveExportColumns(
    options.columnScope ?? "visible",
    options.columns,
    options.context?.allColumns
  );

  let filename = options.filename ?? "export.csv";
  const decision = options.onBeforeExport?.({ rows, columns, filename });
  if (decision === false) return;
  if (decision && decision !== true && decision.filename) {
    filename = decision.filename;
  }

  const csv = rowsToCsv(rows, columns, {
    escapeFormulas: options.escapeFormulas,
    getValue: exportCellValue,
  });
  downloadCsv(filename, csv);
  options.onAfterExport?.({ rows, columns, filename, csv });
}

/**
 * Resolve the `exportCsv` prop into a click handler, or `undefined` when off.
 * Adapters bind this to the toolbar Export button.
 *
 * @typeParam TRow - The row type.
 */
export function makeExportCsvHandler<TRow>(
  exportCsv: boolean | ExportCsvOptions<TRow> | undefined,
  source: TableSource<TRow>,
  columns: readonly ColumnDef<TRow>[],
  context?: ExportContext<TRow>
): (() => void) | undefined {
  const options = resolveExportCsv(exportCsv);
  if (!options) return undefined;
  return () =>
    downloadTableCsv({
      source,
      columns,
      filename: options.filename,
      scope: options.scope,
      columnScope: options.columns,
      escapeFormulas: options.escapeFormulas,
      context,
      onBeforeExport: options.onBeforeExport,
      onAfterExport: options.onAfterExport,
    });
}
