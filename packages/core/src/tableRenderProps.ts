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
import type { ConfirmHandler } from "./actions/confirm";
import type { RowAction } from "./types";
import type { UseDataTableResult } from "./useDataTable/useDataTable";
import type { VirtualTableRow } from "./virtual/useTableVirtualization";

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
  pinOffset?: (
    key: string
  ) => { side: "left" | "right"; inset: number } | undefined;
  /** Optional max height (px) that turns the table into a scroll box. */
  maxHeight?: number;
  /** Commit a new width (px) for a resizable column. */
  setWidth?: (key: string, width: number) => void;
  /** Current per-column widths (px), keyed by column key. */
  columnWidths?: Readonly<Record<string, number>>;
  /** Accessible label for a column-resize handle. */
  resizeLabel?: string;
}
