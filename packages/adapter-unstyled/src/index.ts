/**
 * `@adapttable/unstyled` — the headless, unstyled AdaptTable adapter.
 *
 * Renders semantic HTML with `data-adapttable-part` and `data-*` state
 * hooks plus per-part `className` overrides, so you can style it with
 * Tailwind, shadcn/ui, or your own CSS. Ships no styles of its own.
 *
 * @packageDocumentation
 */

export { cx } from "./cx";
export { DataTable } from "./DataTable";
export type { DataTableClassNames, DataTableProps } from "./types";

/* Re-exported headless engine — source builders, hooks, and types. */
export {
  type ActiveFilterChip,
  type BulkAction,
  type CellProps,
  type ColorScheme,
  type ColumnDef,
  type ConfirmHandler,
  type ConfirmRequest,
  defaultConfirm,
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
  type TableSource,
  useBackendData,
  type UseBackendDataOptions,
  useDataTable,
  type UseDataTableResult,
  useFrontendData,
  type UseFrontendDataOptions,
  useTableUrlState,
} from "@adapttable/core";

/* Router / custom-source integration types (re-exported from core). */
export {
  type ActionConfirm,
  createHistoryAdapter,
  createMemoryAdapter,
  deriveSortByOptions,
  getHistoryAdapter,
  type InfiniteQueryLike,
  type PageSelector,
  type SortableValue,
  type UrlStateAdapter,
  type UseTableUrlStateOptions,
  type UseTableUrlStateResult,
} from "@adapttable/core";
