/**
 * `@adapttable/chakra` — the Chakra UI adapter for AdaptTable.
 *
 * A batteries-included `<DataTable>` built on Chakra components plus the
 * headless source builders re-exported from `@adapttable/core`.
 *
 * @packageDocumentation
 */

export { DataTable } from "./DataTable";
export type { DataTableProps, DataTableSlots } from "./types";

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
