import type {
  ActiveFilterChip,
  BulkAction,
  ChipLabelResolver,
  ColumnDef,
  ConfirmHandler,
  Direction,
  RowAction,
  TableLabels,
  TableSource,
} from "@adapttable/core";
import type { ReactNode } from "react";

/**
 * Per-part class-name hooks. Every node also carries a stable
 * `data-adapttable-part` attribute and `data-*` state attributes so you
 * can style with Tailwind, shadcn, or your own CSS.
 */
export interface DataTableClassNames {
  root?: string;
  toolbar?: string;
  search?: string;
  filtersButton?: string;
  filtersPanel?: string;
  chips?: string;
  chip?: string;
  chipRemove?: string;
  bulkBar?: string;
  bulkButton?: string;
  table?: string;
  thead?: string;
  headerRow?: string;
  headerCell?: string;
  sortButton?: string;
  tbody?: string;
  row?: string;
  cell?: string;
  actionsCell?: string;
  actionButton?: string;
  selectionCell?: string;
  checkbox?: string;
  cards?: string;
  card?: string;
  cardRow?: string;
  cardLabel?: string;
  cardValue?: string;
  footer?: string;
  pageButton?: string;
  empty?: string;
  loading?: string;
  error?: string;
  retryButton?: string;
}

/** Props for the unstyled `<DataTable>`. */
export interface DataTableProps<TRow> {
  /** Data + state contract from `useFrontendData` / `useBackendData`. */
  source: TableSource<TRow>;
  /** Column definitions. */
  columns: ColumnDef<TRow>[];
  /** Stable React key extractor for a row. */
  rowKey: (row: TRow) => string;

  /* ── Display ─────────────────────────────────────────────────────── */
  rowActions?: RowAction<TRow>[];
  tableLabel?: string;
  searchPlaceholder?: string;
  labels?: TableLabels;
  dir?: Direction;
  isMobile?: boolean;
  hideSearch?: boolean;

  /* ── Filters ─────────────────────────────────────────────────────── */
  filters?: ReactNode;
  filterLabels?: Readonly<Record<string, ChipLabelResolver>>;
  extraChips?: readonly ActiveFilterChip[];
  activeFilterCount?: number;
  onClearFilters?: () => void;

  /* ── Bulk actions ────────────────────────────────────────────────── */
  bulkActions?: BulkAction[];
  selectionGetId?: (row: TRow) => string;

  /* ── Customisation ───────────────────────────────────────────────── */
  classNames?: DataTableClassNames;
  toolbar?: ReactNode;
  confirm?: ConfirmHandler;
  skeletonRows?: number;
  /** Empty-state node override. */
  emptyState?: ReactNode;
}
