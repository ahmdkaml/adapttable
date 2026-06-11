import type { BaseDataTableProps } from "@adapttable/core";
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
  /** The search field wrapper (holds the search input + leading icon). */
  searchField?: string;
  /** The leading magnifying-glass icon inside the search field. */
  searchIcon?: string;
  sortSelect?: string;
  /** Rows-per-page `<select>` (toolbar in infinite mode, footer when paged). */
  rowsPerPageSelect?: string;
  filtersButton?: string;
  /** The leading funnel icon inside the Filters button. */
  filtersIcon?: string;
  filtersCount?: string;
  filtersAnchor?: string;
  filtersBackdrop?: string;
  filtersPopover?: string;
  filtersPanel?: string;
  filtersHeader?: string;
  filtersTitle?: string;
  filtersClose?: string;
  filtersBody?: string;
  filtersFooter?: string;
  filtersClear?: string;
  filtersDone?: string;
  chips?: string;
  chip?: string;
  chipRemove?: string;
  columnMenu?: string;
  columnMenuButton?: string;
  columnMenuPanel?: string;
  columnMenuHeader?: string;
  columnMenuTitle?: string;
  columnMenuItem?: string;
  columnMenuGrip?: string;
  columnMenuLabel?: string;
  columnMenuVisibility?: string;
  columnMenuPin?: string;
  columnMenuReset?: string;
  resizeHandle?: string;
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
  loadMore?: string;
  loadMoreButton?: string;
  cards?: string;
  card?: string;
  cardRow?: string;
  cardLabel?: string;
  cardValue?: string;
  footer?: string;
  pageButton?: string;
  empty?: string;
  /** The clear-filters button inside the "no results" empty state. */
  emptyClear?: string;
  loading?: string;
  /** The non-blocking background-refresh progress indicator. */
  refreshIndicator?: string;
  error?: string;
  retryButton?: string;
}

/**
 * Overridable sub-components — a cross-adapter alias for the top-level
 * `emptyState` / `loadingState` props. When both are supplied the `slots`
 * entry wins (`slots.empty ?? emptyState`, `slots.skeleton ?? loadingState`).
 */
export interface DataTableSlots {
  /** Replace the empty-state (alias for `emptyState`). */
  empty?: ReactNode;
  /** Replace the loading skeleton (alias for `loadingState`). */
  skeleton?: ReactNode;
}

/** Props for the unstyled `<DataTable>`. */
export interface DataTableProps<TRow> extends BaseDataTableProps<TRow> {
  /** Per-part class name overrides. */
  classNames?: DataTableClassNames;
  /** Empty-state node override. */
  emptyState?: ReactNode;
  /** Loading-state node override (replaces the skeleton on first load). */
  loadingState?: ReactNode;
  /**
   * Cross-adapter alias for `emptyState` / `loadingState`. Takes precedence
   * over the top-level props when both are provided.
   */
  slots?: DataTableSlots;
}
