/**
 * `@adapttable/mantine` — the Mantine adapter for AdaptTable.
 *
 * Exposes a batteries-included `<DataTable>` plus the headless source
 * builders re-exported from `@adapttable/core`, so a consumer can import
 * everything they need from one entry point.
 *
 * @packageDocumentation
 */

export { DataTable } from "./DataTable";
export type {
  ConfirmHandler,
  ConfirmRequest,
  DataTableClassNames,
  DataTableProps,
  DataTableSlots,
} from "./types";

/* Styled sub-components (also overridable / reusable on their own). */
export {
  ActiveFilterChips,
  type ActiveFilterChipsProps,
} from "./components/ActiveFilterChips";
export { EmptyState, type EmptyStateProps } from "./components/EmptyState";
export { ErrorState, type ErrorStateProps } from "./components/ErrorState";
export {
  PaginationFooter,
  type PaginationFooterProps,
} from "./components/PaginationFooter";
export {
  TableSkeleton,
  type TableSkeletonProps,
} from "./components/TableSkeleton";

/* Confirmation + animation helpers. */
export {
  type MountStaggerOptions,
  useMountStagger,
} from "./animation/useMountStagger";
export { defaultConfirm, useConfirm } from "./hooks/useConfirm";

/* Re-exported headless engine — source builders, hooks, and types. */
export {
  type ActiveFilterChip,
  type BulkAction,
  type CellProps,
  type ColorScheme,
  type ColumnDef,
  defaultLabels,
  type Direction,
  type ExtraFilters,
  type FilterValue,
  type PaginatedResponse,
  type PaginationMode,
  type RowAction,
  type SortByOption,
  type SortDirection,
  type TableLabels,
  type TableQueryParams,
  type TableSource,
  useBackendData,
  type UseBackendDataOptions,
  useDataTable,
  type UseDataTableResult,
  useFrontendData,
  type UseFrontendDataOptions,
  useTableUrlState,
} from "@adapttable/core";
