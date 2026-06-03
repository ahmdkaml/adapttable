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
  sortSelect?: string;
  filtersButton?: string;
  filtersBackdrop?: string;
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
  columnMenuItem?: string;
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
  loading?: string;
  error?: string;
  retryButton?: string;
}

/** Props for the unstyled `<DataTable>`. */
export interface DataTableProps<TRow> extends BaseDataTableProps<TRow> {
  /** Per-part class name overrides. */
  classNames?: DataTableClassNames;
  /** Empty-state node override. */
  emptyState?: ReactNode;
  /** Loading-state node override (replaces the skeleton on first load). */
  loadingState?: ReactNode;
}
