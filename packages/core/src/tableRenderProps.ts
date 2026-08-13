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
import { type ReactNode, useMemo, useRef } from "react";

import type { ConfirmHandler } from "./actions/confirm";
import type { PinOffset } from "./columns/useColumnLayout";
import type { EditableCellEditing } from "./editing/editableCellController";
import type { GridFocusState } from "./focus/useGridFocus";
import type { GroupByInput } from "./grouping/groupKeys";
import type { GroupedFlatEntry } from "./grouping/groupRows";
import type { GroupCollapseState } from "./grouping/useGroupCollapse";
import type { RowExpansionState } from "./rows/useRowExpansion";
import type { SelectionState } from "./selection/useSelection";
import type { TreeEntry } from "./tree/treeRows";
import type { TreeExpansionState } from "./tree/useTreeExpansion";
import type { ColumnDef, RowAction, TableLabels } from "./types";
import type { UseDataTableResult } from "./useDataTable/useDataTable";
import type { RowPairMeasurer } from "./virtual/measureRowPair";
import type { ColumnWindow } from "./virtual/useColumnWindow";
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
  /**
   * Cell-navigation getters, from the shell. Inert unless `cellNavigation` is
   * set, so a renderer spreads them unconditionally.
   */
  gridFocus?: GridFocusState;
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
  /**
   * Inline cell-editing bundle — present iff the host passed `onCellEdit`.
   * Omit it and every cell stays plain display (package DNA: opt-in).
   */
  editing?: EditableCellEditing<TRow>;
  /**
   * Tree bundle — present iff the host declared a hierarchy. Adapters render
   * `tree.entries` in place of plain rows and put a {@link TreeToggle} plus
   * `treeIndentStyle` in the `tree.columnKey` cell.
   */
  tree?: {
    entries: readonly TreeEntry<TRow>[];
    expansion: TreeExpansionState;
    columnKey?: string;
    /** Nodes fetching their children right now (`onLoadChildren`). */
    loadingIds?: ReadonlySet<string>;
    /** Nodes whose last fetch rejected — closed, and clickable again. */
    failedIds?: ReadonlySet<string>;
  };
  /**
   * Row-grouping bundle — present iff chrome armed grouping. Adapters that
   * do not yet render group headers may ignore it; leaf `rows` stay valid.
   */
  grouping?: {
    /** The grouping keys in order — one for a flat group, more for nested. */
    groupBy: readonly string[];
    collapsed: GroupCollapseState;
    entries: readonly GroupedFlatEntry<TRow>[];
    setGroupBy: (key: GroupByInput) => void;
    /** Open every group. */
    expandAll: () => void;
    /** Close every group, at every level. */
    collapseAll: () => void;
    /** Show the tree down to `depth` and no further. */
    collapseToDepth: (depth: number) => void;
    /** Reveal the next page of groups, or of one group's rows. */
    showMore: (entry: { scope: "groups" | "rows"; groupKey?: string }) => void;
  };
  /** Virtual row window (with absolute indices) when virtualization is on. */
  rowEntries?: readonly VirtualTableRow<TRow>[];
  /** Spacer height above the virtual window. */
  paddingTop?: number;
  /** Spacer height below the virtual window. */
  paddingBottom?: number;
  /** Ref callback that lets the virtualizer measure a row element. */
  measureElement?: (element: Element | null) => void;
  /**
   * Measure a row together with its open detail panel — used instead of
   * `measureElement` when the table can expand rows, since the two are
   * separate elements and the pair is what the window has to size.
   */
  measureRowPair?: RowPairMeasurer;
  /**
   * The windowed columns, when the table windows its horizontal axis. The
   * render model swaps them in, so adapters map over `model.columns` exactly
   * as before and render the two spacer cells `columnSpacers` describes.
   */
  columnWindow?: ColumnWindow<TRow>;
  /**
   * Whether the table fits its container rather than overflowing it. Adapters
   * spread `fittedTableStyle(fitColumns)` onto their `<table>`: percentage
   * widths only mean anything under a fixed table layout.
   */
  fitColumns?: boolean;
  /** Whether the header sticks to the top of the scroll box. */
  stickyHeader?: boolean;
  /** Offset (px) applied to the sticky header top. */
  stickyTop?: number;
  /** Resolve a pinned column's side + inset (px), or `undefined` if unpinned. */
  pinOffset?: (key: string) => PinOffset | undefined;
  /** Optional max height (px) that turns the table into a scroll box. */
  maxHeight?: number;
  /**
   * Attach to the `maxHeight` scroll box so an element-mode virtual window
   * tracks the box's scrolling (from `useChromeBodyData`).
   */
  virtualScrollRef?: (node: HTMLElement | null) => void;
  /** Commit a new width (px) for a resizable column. */
  setWidth?: (key: string, width: number) => void;
  /** Current per-column widths (px), keyed by column key. */
  columnWidths?: Readonly<Record<string, number>>;
  /** Accessible label for a column-resize handle. */
  resizeLabel?: string;
}

/** The shared prelude every table/card renderer derives before rendering. */
export interface TableRenderModel<TRow> {
  columns: readonly ColumnDef<TRow>[];
  selection: SelectionState | null;
  labels: Required<TableLabels>;
  /** Whether a trailing actions column/section renders. */
  showActions: boolean;
  /** Materialised row entries (virtual window or the full set). */
  entries: readonly VirtualTableRow<TRow>[];
  /** Spacer/detail colSpan: expansion + selection + data + actions. */
  columnSpan: number;
  /**
   * Widths of the spacer cells holding open the columns outside the window,
   * or `undefined` when every column is rendered. A row renders one before its
   * cells and one after them.
   */
  columnSpacers?: { start: number; end: number };
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
    | "table"
    | "rows"
    | "rowActions"
    | "getRowId"
    | "rowEntries"
    | "renderRowDetail"
    | "expansion"
    | "columnWindow"
    | "editing"
  >
): TableRenderModel<TRow> {
  const { selection, labels } = props.table;
  // Windowed columns replace the full set for every renderer at once, so no
  // adapter has to know whether the horizontal axis is windowed.
  const windowed = props.columnWindow?.enabled === true;
  const columns = windowed
    ? (props.columnWindow?.columns ?? props.table.columns)
    : props.table.columns;
  // The trailing control column exists for row actions AND for row-mode's own
  // edit / save / cancel — both live there, and a row edit with nowhere to be
  // saved from would be a mode nobody can leave.
  const showActions =
    (props.rowActions?.length ?? 0) > 0 ||
    props.editing?.rowEditing !== undefined;
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
    columnSpan:
      virtualColumnSpan(
        columns.length,
        Boolean(selection),
        showActions,
        Boolean(props.renderRowDetail && props.expansion)
      ) + (windowed ? 2 : 0),
    columnSpacers: windowed
      ? {
          start: props.columnWindow?.paddingStart ?? 0,
          end: props.columnWindow?.paddingEnd ?? 0,
        }
      : undefined,
  };
}

/**
 * Memoised `summaryRow` aggregation: re-executes ONLY when the rendered
 * rows change, never on unrelated table re-renders (a search keystroke,
 * a checkbox toggle). The builder is read through a ref because callers
 * routinely pass it inline — a fresh identity every render — and the
 * aggregate walks the full filtered set, which is exactly the work this
 * exists to avoid repeating.
 *
 * @typeParam TRow - The row type.
 * @param summaryRow - The caller's summary builder, or `undefined` when off.
 * @param rows - The rows the summary describes.
 * @returns The aggregate cells, or `undefined` when no builder is set.
 */
export function useSummaryCells<TRow>(
  summaryRow:
    | ((rows: readonly TRow[]) => Partial<Record<string, ReactNode>>)
    | undefined,
  rows: readonly TRow[]
): Partial<Record<string, ReactNode>> | undefined {
  const builderRef = useRef(summaryRow);
  builderRef.current = summaryRow;
  const enabled = summaryRow !== undefined;
  return useMemo(
    () => (enabled ? builderRef.current?.(rows) : undefined),
    [enabled, rows]
  );
}
