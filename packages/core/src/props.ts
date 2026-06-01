import type { ReactNode } from "react";

import type { ConfirmHandler } from "./actions/confirm";
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
  /** Force the mobile layout (otherwise resolved from the viewport). */
  isMobile?: boolean;
  /** Hover-prefetch callback fired on desktop row mouse-enter. */
  prefetch?: (row: TRow) => void;
  /** Disable the built-in search box. */
  hideSearch?: boolean;

  /* ── Filters ─────────────────────────────────────────────────────── */
  /** Filter widgets rendered in the drawer / panel. */
  filters?: ReactNode;
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

  /* ── Customisation (common) ──────────────────────────────────────── */
  /** Inline toolbar slot for custom controls (view toggles, etc.). */
  toolbar?: ReactNode;
  /** Confirmation handler for actions; defaults to `window.confirm`. */
  confirm?: ConfirmHandler;
  /** Number of skeleton rows while loading. Defaults to 5. */
  skeletonRows?: number;
}
