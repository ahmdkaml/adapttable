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
  resolveDisabledReason,
  runRowAction,
} from "./actions/confirm";
export {
  type BulkActionRunner,
  useBulkActionRunner,
  type UseBulkActionRunnerOptions,
} from "./actions/useBulkActionRunner";

/* ── Shared prop surface + orchestration ───────────────────────────── */
export type { BaseDataTableProps } from "./props";
export {
  type BulkBarChromeProps,
  type TableBody,
  type TableChrome,
  type ToolbarChromeProps,
  useTableChrome,
} from "./useTableChrome";

/* ── Labels ────────────────────────────────────────────────────────── */
export { defaultLabels, resolveLabels } from "./labels";

/* ── Constants ─────────────────────────────────────────────────────── */
export {
  DEFAULT_CARD_SIZE_PX,
  DEFAULT_LIMIT,
  DEFAULT_ROW_SIZE_PX,
  MOBILE_BREAKPOINT_PX,
  PAGE_SIZE_OPTIONS,
  pageSizeOptions,
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
  useColumnLayoutUrlState,
  type UseColumnLayoutUrlStateOptions,
  type UseColumnLayoutUrlStateResult,
} from "./url/useColumnLayoutUrlState";
export {
  useTableUrlState,
  type UseTableUrlStateOptions,
  type UseTableUrlStateResult,
} from "./url/useTableUrlState";

/* ── Shared render contracts ───────────────────────────────────────── */
export type { SharedTableRenderProps } from "./tableRenderProps";

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
  clearCountFilterExtra,
  COUNT_OPERATOR_SYMBOL,
  COUNT_OPERATORS,
  countFilterChipLabel,
  countFilterExtra,
  type CountFilterState,
  countFilterStateFromExtra,
  type CountOperator,
  isCountFilterComplete,
  sanitizeCountFilterParams,
} from "./filters/countFilters";
export {
  type ActiveFilterChip,
  type ChipLabelResolver,
  mergeFilterChips,
  resolveActiveFilterCount,
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
export { deriveSortByOptions } from "./sort/sortByOptions";

/* ── Columns ───────────────────────────────────────────────────────── */
export {
  columnMenuLabel,
  type ColumnMenuRow,
  columnMenuRows,
} from "./columns/columnMenuModel";
export {
  COLUMN_DND_MIME,
  type ColumnDropProps,
  columnDropProps,
  type ColumnReorderKeyProps,
  columnReorderKeyProps,
  type ColumnRowDragProps,
  columnRowDragProps,
} from "./columns/columnReorder";
export {
  COLUMN_RESIZE_STEP,
  type ColumnResizeHandleProps,
  columnResizeHandleProps,
  MIN_COLUMN_WIDTH,
} from "./columns/columnResize";
export {
  FALLBACK_PIN_WIDTH,
  parsePxWidth,
  resolveColumnWidth,
  tableMinWidth,
} from "./columns/columnWidths";
export { EyeIcon, GripIcon, PinIcon } from "./columns/icons";
export {
  type ColumnLayoutState,
  edgePinStyle,
  EMPTY_COLUMN_LAYOUT,
  PIN_Z,
  type PinLeads,
  type PinnedCellStyle,
  pinnedCellStyle,
  useColumnLayout,
  type UseColumnLayoutOptions,
  type UseColumnLayoutResult,
} from "./columns/useColumnLayout";
export { type TableLayout, visibleColumns } from "./columns/visibleColumns";

/* ── Pagination ────────────────────────────────────────────────────── */
export {
  computePagination,
  type PaginationInfo,
} from "./pagination/paginationMath";

/* ── Hooks ─────────────────────────────────────────────────────────── */
export { DARK_SCHEME_QUERY, useColorScheme } from "./hooks/useColorScheme";
export { useDebounce } from "./hooks/useDebounce";
export {
  useInfiniteScroll,
  type UseInfiniteScrollOptions,
} from "./hooks/useInfiniteScroll";
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
export {
  useScrollToTableTop,
  type UseScrollToTableTopOptions,
} from "./hooks/useScrollToTableTop";

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

/* ── Virtualization ───────────────────────────────────────────────── */
export {
  resolveVirtualRows,
  type TableVirtualization,
  useTableVirtualization,
  type UseTableVirtualizationOptions,
  virtualColumnSpan,
  type VirtualTableRow,
} from "./virtual/useTableVirtualization";

/* ── Utils ─────────────────────────────────────────────────────────── */
export { mergeProps, type Props } from "./utils/mergeProps";
export { stableKey } from "./utils/stableKey";
