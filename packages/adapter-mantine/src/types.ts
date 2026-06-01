import type {
  ActiveFilterChip,
  BulkAction,
  ChipLabelResolver,
  ColumnDef,
  Direction,
  RowAction,
  SortByOption,
  TableLabels,
  TableSource,
} from "@adapttable/core";
import type { ReactNode } from "react";

/** A confirmation request raised by a row or bulk action. */
export interface ConfirmRequest {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  danger?: boolean;
  onConfirm: () => void;
}

/** Shows a confirmation dialog, then runs `onConfirm` if accepted. */
export type ConfirmHandler = (request: ConfirmRequest) => void;

/** Overridable sub-components. Each defaults to a styled Mantine part. */
export interface DataTableSlots {
  /** Replace the loading skeleton. */
  skeleton?: ReactNode;
  /** Replace the empty-state. */
  empty?: ReactNode;
}

/** Per-part class name overrides. */
export interface DataTableClassNames {
  root?: string;
  toolbar?: string;
  table?: string;
  card?: string;
  footer?: string;
}

/** Props for the Mantine `<DataTable>`. */
export interface DataTableProps<TRow> {
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
  /** Options for the mobile sort-by select. */
  sortByOptions?: SortByOption[];
  /** Pre-translated label overrides. */
  labels?: TableLabels;
  /** Text direction. Defaults to `"ltr"`. */
  dir?: Direction;
  /** Force mobile layout (otherwise resolved from the viewport). */
  isMobile?: boolean;
  /** Hover-prefetch callback fired on desktop row mouse-enter. */
  prefetch?: (row: TRow) => void;
  /** Disable the built-in search box. */
  hideSearch?: boolean;

  /* ── Filters ─────────────────────────────────────────────────────── */
  /** Filter widgets rendered inside the drawer. */
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

  /* ── Customisation ───────────────────────────────────────────────── */
  /** Replace sub-components (skeleton, empty-state). */
  slots?: DataTableSlots;
  /** Per-part class name overrides. */
  classNames?: DataTableClassNames;
  /** Inline toolbar slot for custom controls (view toggles, etc.). */
  toolbar?: ReactNode;
  /** Confirmation handler for actions; defaults to `window.confirm`. */
  confirm?: ConfirmHandler;
  /** Number of skeleton rows while loading. Defaults to 5. */
  skeletonRows?: number;
  /**
   * Animate rows/cards on mount with the provided stagger hook (e.g. the
   * GSAP one from `@adapttable/mantine/animation`). Off by default; honors
   * reduced motion.
   */
  animate?: boolean;
}

/** Mantine color alias re-export for action colors. */
export type { MantineColor } from "@mantine/core";
