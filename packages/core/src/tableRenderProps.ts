/**
 * The render-time contract shared by every adapter's table/card renderer.
 *
 * Each adapter renders its own markup (MUI `<Table>`, Chakra `<Table>`, plain
 * `<table>`, …) but consumes the same headless inputs: the resolved table
 * model, the visible rows, row-action wiring, virtualization padding, and the
 * column sticky/resize layout. Extracting it here keeps those adapters from
 * re-declaring the identical prop list (and keeps them in lockstep).
 *
 * Adapters extend this with their own kit-specific extras (size tokens,
 * colour scheme, className slots).
 *
 * @typeParam TRow - The row type.
 */
import type { ReactNode } from "react";

import type { ConfirmHandler } from "./actions/confirm";
import type { PinOffset } from "./columns/useColumnLayout";
import type { RowExpansionState } from "./rows/useRowExpansion";
import type { SelectionState } from "./selection/useSelection";
import type { ColumnDef, RowAction, TableLabels } from "./types";
import type { UseDataTableResult } from "./useDataTable/useDataTable";
import {
  resolveVirtualRows,
  virtualColumnSpan,
  type VirtualTableRow,
} from "./virtual/useTableVirtualization";

export interface SharedTableRenderProps<TRow> {
  /** The resolved table model from `useDataTable`. */
  table: UseDataTableResult<TRow>;
  /** The rows to render for the current page/window. */
  rows: readonly TRow[];
  /** Per-row actions rendered in a trailing actions column. */
  rowActions?: RowAction<TRow>[];
  /** Confirmation handler used before destructive row actions run. */
  confirm: ConfirmHandler;
  /** Stable row identity used for keys and selection. */
  getRowId: (row: TRow) => string;
  /** Hover-prefetch callback fired on desktop row mouse-enter. */
  prefetch?: (row: TRow) => void;
  /** Row activation handler — see `BaseDataTableProps.onRowClick`. */
  onRowClick?: (row: TRow) => void;
  /** Conditional per-row class — see `BaseDataTableProps.rowClassName`. */
  rowClassName?: (row: TRow, index: number) => string | undefined;
  /** Detail-panel renderer — see `BaseDataTableProps.renderRowDetail`. */
  renderRowDetail?: (row: TRow) => ReactNode;
  /** Footer summary builder — see `BaseDataTableProps.summaryRow`. */
  summaryRow?: (rows: readonly TRow[]) => Partial<Record<string, ReactNode>>;
  /** Expansion state, present when `renderRowDetail` is set. */
  expansion?: RowExpansionState;
  /** Virtual row window (with absolute indices) when virtualization is on. */
  rowEntries?: readonly VirtualTableRow<TRow>[];
  /** Spacer height above the virtual window. */
  paddingTop?: number;
  /** Spacer height below the virtual window. */
  paddingBottom?: number;
  /** Ref callback that lets the virtualizer measure a row element. */
  measureElement?: (element: Element | null) => void;
  /** Whether the header sticks to the top of the scroll box. */
  stickyHeader?: boolean;
  /** Offset (px) applied to the sticky header top. */
  stickyTop?: number;
  /** Resolve a pinned column's side + inset (px), or `undefined` if unpinned. */
  pinOffset?: (key: string) => PinOffset | undefined;
  /** Optional max height (px) that turns the table into a scroll box. */
  maxHeight?: number;
  /** Commit a new width (px) for a resizable column. */
  setWidth?: (key: string, width: number) => void;
  /** Current per-column widths (px), keyed by column key. */
  columnWidths?: Readonly<Record<string, number>>;
  /** Accessible label for a column-resize handle. */
  resizeLabel?: string;
}

/** The shared prelude every table/card renderer derives before rendering. */
export interface TableRenderModel<TRow> {
  columns: ColumnDef<TRow>[];
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  /** Whether a trailing actions column/section renders. */
  showActions: boolean;
  /** Materialised row entries (virtual window or the full set). */
  entries: readonly VirtualTableRow<TRow>[];
  /** Spacer-row colSpan covering selection + data + actions columns. */
  columnSpan: number;
}

/**
 * Derive the shared render prelude from {@link SharedTableRenderProps} —
 * extracted so each adapter's renderer doesn't repeat the identical block
 * (and trip the duplication gate).
 *
 * @typeParam TRow - The row type.
 */
export function tableRenderModel<TRow>(
  props: Pick<
    SharedTableRenderProps<TRow>,
    "table" | "rows" | "rowActions" | "getRowId" | "rowEntries"
  >
): TableRenderModel<TRow> {
  const { columns, selection, labels } = props.table;
  const showActions = (props.rowActions?.length ?? 0) > 0;
  const entries = resolveVirtualRows(
    props.rows,
    props.getRowId,
    props.rowEntries
  );
  return {
    columns,
    selection,
    labels,
    showActions,
    entries,
    columnSpan: virtualColumnSpan(
      columns.length,
      Boolean(selection),
      showActions
    ),
  };
}
