import type { ReactNode } from "react";

import type { ConfirmHandler } from "./actions/confirm";
import type { ColumnLayoutState } from "./columns/useColumnLayout";
import type { FilterDef } from "./filters/filterDefs";
import type {
  ActiveFilterChip,
  ChipLabelResolver,
} from "./filters/useActiveFilterChips";
import type { TableSource } from "./source/TableSource";
import type {
  BulkAction,
  ColumnDef,
  Direction,
  RowAction,
  SortByOption,
  TableLabels,
} from "./types";

/**
 * The UI-agnostic prop surface shared by every AdaptTable adapter's
 * `<DataTable>`. Adapters extend this with kit-specific extras (slots,
 * classNames, animation, …) so the common contract lives in one place.
 *
 * @typeParam TRow - The row type.
 */
export interface BaseDataTableProps<TRow> {
  /** Data + state contract from `useFrontendData` / `useBackendData`. */
  source: TableSource<TRow>;
  /** Column definitions. */
  columns: ColumnDef<TRow>[];
  /** Stable React key extractor for a row. */
  rowKey: (row: TRow) => string;

  /* ── Display ─────────────────────────────────────────────────────── */
  /** Trailing per-row actions. */
  rowActions?: RowAction<TRow>[];
  /** Accessible label for the table. */
  tableLabel?: string;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Options for a mobile sort-by select. */
  sortByOptions?: SortByOption[];
  /** Pre-translated label overrides. */
  labels?: TableLabels;
  /** Text direction. Defaults to `"ltr"`. */
  dir?: Direction;
  /**
   * Row density — independent of column pinning. `"comfortable"` (default) is
   * the roomy layout; `"compact"` tightens row height/padding. Each adapter
   * maps it to its kit's table size.
   */
  density?: "comfortable" | "compact";
  /** Force the mobile layout (otherwise resolved from the viewport). */
  isMobile?: boolean;
  /** Leading desktop-visible columns kept on mobile even if hideOnMobile. */
  mobileIdentityColumns?: number;
  /** Hover-prefetch callback fired on desktop row mouse-enter. */
  prefetch?: (row: TRow) => void;
  /**
   * Row activation — fires on row click and on Enter when the row has focus.
   * Interactive children (action buttons, the selection checkbox, links)
   * keep their own behaviour and never trigger it.
   */
  onRowClick?: (row: TRow) => void;
  /** Called whenever the materialized source rows change. */
  onRowsChange?: (rows: readonly TRow[]) => void;
  /**
   * Conditional per-row class: `(row, index) => "overdue"` — appended to the
   * adapter's own row classes on desktop rows and mobile cards alike.
   */
  rowClassName?: (row: TRow, index: number) => string | undefined;
  /** Disable the built-in search box. */
  hideSearch?: boolean;

  /* ── Column management ───────────────────────────────────────────── */
  /** Render the built-in "Columns" menu (show/hide, pin, reorder). */
  enableColumnMenu?: boolean;
  /** Enable drag/keyboard column resize handles. Defaults to false (opt-in). */
  resizableColumns?: boolean;
  /** Controlled column layout (hidden/order/pinned/widths). */
  columnLayout?: ColumnLayoutState;
  /** Change handler for the controlled column layout. */
  onColumnLayoutChange?: (next: ColumnLayoutState) => void;
  /** Initial column layout for the uncontrolled mode. */
  defaultColumnLayout?: Partial<ColumnLayoutState>;
  /**
   * Fixed-height scroll box (px). Enables sideways scrolling + column pinning;
   * the header and pinned columns pin within this box. Omit for page scroll.
   */
  maxHeight?: number;

  /* ── Virtualization ──────────────────────────────────────────────── */
  /** Virtualize long infinite lists. Defaults to false. */
  virtualize?: boolean;
  /** Desktop row-size estimate in px. */
  estimateRowSize?: number;
  /** Mobile card-size estimate in px. */
  estimateCardSize?: number;
  /** Extra rows/cards rendered before and after the virtual window. */
  virtualOverscan?: number;
  /** Scroll margin for window virtualization, usually sticky chrome height. */
  virtualScrollMargin?: number;

  /* ── Filters ─────────────────────────────────────────────────────── */
  /**
   * The table's filters. Pass a declarative array and the adapter builds the
   * form with kit-native widgets (each definition also drives URL parsing,
   * chips and — on frontend data — the row predicate); pass JSX to draw the
   * form yourself. Column-level `filter` shorthands merge in; a `filters`
   * entry with the same key wins.
   */
  filters?: readonly FilterDef<TRow>[] | ReactNode;
  /**
   * How the filter container opens. `"popover"` (default) anchors a light
   * card under the Filters button — no backdrop, closing on Escape and
   * outside click; `"drawer"` slides in a side panel with a real backdrop.
   * The caller passes the same `filters` content either way — only the
   * container changes.
   */
  filtersMode?: "popover" | "drawer";
  /** Per-filter-key chip label resolvers. */
  filterLabels?: Readonly<Record<string, ChipLabelResolver>>;
  /** Extra chips driven by non-URL state, merged with the derived chips. */
  extraChips?: readonly ActiveFilterChip[];
  /** Override the active-filter count (defaults to the chip count). */
  activeFilterCount?: number;
  /** Clear-filters handler used by the drawer + chip strip. */
  onClearFilters?: () => void;

  /* ── Bulk actions ────────────────────────────────────────────────── */
  /** Bulk actions — enabling these turns on row selection. */
  bulkActions?: BulkAction[];
  /** Selection id extractor; defaults to `rowKey`. */
  selectionGetId?: (row: TRow) => string;
  /**
   * Controlled selection. When provided, the table reads the selection from
   * this value and reports every change request through `onSelectionChange`
   * — the same controlled/uncontrolled split as `columnLayout`. Omit it for
   * the internal (uncontrolled) selection.
   */
  selectedIds?: readonly string[];
  /**
   * Selection change channel. Uncontrolled: an observer that fires with the
   * selected ids whenever the set changes (toggles, select-all, automatic
   * resets on search/filter change). Controlled (`selectedIds` provided):
   * the change-request handler — apply the ids to your state to accept.
   */
  onSelectionChange?: (selectedIds: string[]) => void;

  /* ── Customisation (common) ──────────────────────────────────────── */
  /** Inline toolbar slot for custom controls (view toggles, etc.). */
  toolbar?: ReactNode;
  /** Confirmation handler for actions; defaults to `window.confirm`. */
  confirm?: ConfirmHandler;
  /** Number of skeleton rows while loading. Defaults to the page size. */
  skeletonRows?: number;
  /** Sticky toolbar top offset in px. Defaults to 0. */
  stickyTop?: number;
  /** Keep the desktop table header sticky while scrolling. Defaults to false (opt-in). */
  stickyHeader?: boolean;
  /** Scroll back to the table when search/filter/page changes. Defaults to true. */
  scrollToTopOnChange?: boolean;
  /** Extra gap below sticky chrome when scrolling back. Defaults to 8. */
  scrollTopGap?: number;
}
