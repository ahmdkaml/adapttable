/**
 * `@adapttable/core` — the headless engine behind AdaptTable.
 *
 * Zero UI-kit, i18n-library, or router imports. Exposes the unified
 * {@link TableSource} contract, the `useFrontendData` / `useBackendData`
 * source builders, URL-synced state with an injectable adapter, filter
 * chips, selection, and the `useDataTable` prop-getter API.
 *
 * @packageDocumentation
 */

/* ── Types ─────────────────────────────────────────────────────────── */
export type {
  ActionConfirm,
  BulkAction,
  CellProps,
  ColorScheme,
  ColumnDef,
  Direction,
  ExtraFilters,
  FilterValue,
  PaginatedResponse,
  PaginationMode,
  ResolvedPaginationMode,
  RowAction,
  SortableValue,
  SortByOption,
  SortDirection,
  TableLabels,
  TableQueryParams,
} from "./types";

/* ── Actions (confirm + runners) ───────────────────────────────────── */
export {
  type ConfirmHandler,
  type ConfirmRequest,
  defaultConfirm,
  runRowAction,
} from "./actions/confirm";
export {
  type BulkActionRunner,
  useBulkActionRunner,
  type UseBulkActionRunnerOptions,
} from "./actions/useBulkActionRunner";

/* ── Labels ────────────────────────────────────────────────────────── */
export { defaultLabels, resolveLabels } from "./labels";

/* ── Constants ─────────────────────────────────────────────────────── */
export {
  DEFAULT_CARD_SIZE_PX,
  DEFAULT_LIMIT,
  DEFAULT_ROW_SIZE_PX,
  MOBILE_BREAKPOINT_PX,
  PAGE_SIZE_OPTIONS,
  SEARCH_DEBOUNCE_MS,
  VIRTUAL_OVERSCAN,
} from "./constants";

/* ── URL state ─────────────────────────────────────────────────────── */
export {
  createHistoryAdapter,
  createMemoryAdapter,
  getHistoryAdapter,
  type UrlStateAdapter,
} from "./url/adapter";
export {
  useTableUrlState,
  type UseTableUrlStateOptions,
  type UseTableUrlStateResult,
} from "./url/useTableUrlState";

/* ── Sources ───────────────────────────────────────────────────────── */
export type { TableSource } from "./source/TableSource";
export {
  type InfiniteQueryLike,
  type PageSelector,
  useBackendData,
  type UseBackendDataOptions,
} from "./source/useBackendData";
export {
  defaultSearchText,
  useFrontendData,
  type UseFrontendDataOptions,
} from "./source/useFrontendData";

/* ── Filters / chips ───────────────────────────────────────────────── */
export {
  type ActiveFilterChip,
  type ChipLabelResolver,
  useActiveFilterChips,
  type UseActiveFilterChipsOptions,
} from "./filters/useActiveFilterChips";
export {
  useExtraChips,
  type UseExtraChipsOptions,
} from "./filters/useExtraChips";

/* ── Selection ─────────────────────────────────────────────────────── */
export {
  type HeaderSelectionState,
  type SelectionState,
  useSelection,
  type UseSelectionOptions,
} from "./selection/useSelection";

/* ── Sorting ───────────────────────────────────────────────────────── */
export { compareValues, sortRows } from "./sort/compare";
export { nextSort, type SortState } from "./sort/cycleSort";

/* ── Columns ───────────────────────────────────────────────────────── */
export { type TableLayout, visibleColumns } from "./columns/visibleColumns";

/* ── Pagination ────────────────────────────────────────────────────── */
export {
  computePagination,
  type PaginationInfo,
} from "./pagination/paginationMath";

/* ── Hooks ─────────────────────────────────────────────────────────── */
export { useDebounce } from "./hooks/useDebounce";
export {
  MOBILE_MEDIA_QUERY,
  resolvePaginationMode,
  useIsMobile,
} from "./hooks/useIsMobile";
export { useMediaQuery } from "./hooks/useMediaQuery";
export {
  REDUCED_MOTION_QUERY,
  usePrefersReducedMotion,
} from "./hooks/usePrefersReducedMotion";

/* ── Orchestrator ──────────────────────────────────────────────────── */
export {
  useDataTable,
  type UseDataTableOptions,
  type UseDataTableResult,
} from "./useDataTable/useDataTable";
export {
  type SearchInputState,
  useSearchInput,
} from "./useDataTable/useSearchInput";

/* ── Utils ─────────────────────────────────────────────────────────── */
export { mergeProps, type Props } from "./utils/mergeProps";
export { stableKey } from "./utils/stableKey";
