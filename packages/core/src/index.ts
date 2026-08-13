/**
 * `@adapttable/core` — the headless engine behind AdaptTable.
 *
 * Zero UI-kit, i18n-library, or router imports. Exposes the unified
 * {@link TableSource} contract, the `useFrontendData` / `useServerData` /
 * `useQuerySource` source builders, URL-synced state with an injectable adapter, filter
 * chips, selection, and the `useDataTable` prop-getter API.
 *
 * @packageDocumentation
 */

/* ── Types ─────────────────────────────────────────────────────────── */
export type {
  ActionConfirm,
  BulkAction,
  BulkActionContext,
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
  type BulkActionOutcome,
  type BulkActionRunner,
  useBulkActionRunner,
  type UseBulkActionRunnerOptions,
} from "./actions/useBulkActionRunner";

/* ── Shared prop surface + orchestration ───────────────────────────── */
/* ── Declarative filters & data tiers ──────────────────────────────── */
export {
  aggregate,
  AGGREGATE_NAMES,
  type AggregateName,
  type AggregateOptions,
  type AggregateSpec,
  type Aggregator,
} from "./aggregate/aggregate";
export { columnText } from "./columns/columnText";
export { computed, type ComputedColumnSpec } from "./columns/computed";
export { localizedColumnPath, resolveColumns } from "./columns/resolveColumns";
export {
  AUTO_OPTIONS_LIMIT,
  buildFilterRuntime,
  clearedFilterExtras,
  type ColumnFilter,
  FILTER_TYPES,
  type FilterDef,
  filterLabel,
  type FilterOption,
  type FilterOptionsSource,
  filterPredicate,
  type FilterRuntime,
  filterStateKeys,
  type FilterType,
  materializeAutoOptions,
  RANGE_SUFFIXES,
  resolveFilterDefs,
} from "./filters/filterDefs";
export {
  type FilterFormSource,
  listFilterValues,
  type RangeFieldWidget,
  type RangeOpLabelKeys,
  scalarFilterText,
  useRangeFilterWidget,
} from "./filters/filterForm";
export {
  RANGE_OP_LABEL_KEYS,
  RANGE_OPS,
  type RangeOp,
  type RangeWidgetState,
  readRangeWidget,
  writeRangeWidget,
} from "./filters/rangeWidget";
export {
  type ResolvedFilterOptions,
  useFilterOptions,
} from "./filters/useFilterOptions";
export {
  findMatches,
  type FindMatchesOptions,
  matchKey,
  matchKeySet,
  stepMatch,
} from "./find/findMatches";
export {
  type FindInTableState,
  useFindFocus,
  useFindInTable,
  type UseFindInTableOptions,
} from "./find/useFindInTable";
export { batchEditHandler, type CellEdit } from "./focus/cellEdits";
export {
  type CellRange,
  type CellRangeBounds,
  cellRangeBounds,
  cellRangeIndices,
  cellRangeSize,
  extendCellRange,
  isInCellRange,
  isSingleCell,
  singleCellRange,
} from "./focus/cellRange";
export {
  type ClipboardRangeOptions,
  clipboardRangeText,
  readClipboardText,
  writeClipboardText,
} from "./focus/clipboardRange";
export {
  type FillDirection,
  fillDirection,
  fillRangeEdits,
  type FillRangeOptions,
  fillTargetRange,
} from "./focus/fillRange";
export {
  type GridBounds,
  type GridCell,
  type GridFocusMove,
  gridFocusMoveForKey,
  type GridKeyPress,
  moveGridFocus,
  sameGridCell,
} from "./focus/gridFocus";
export {
  cellFillHandler,
  type CellFillHandlerOptions,
  cellPasteHandler,
  type CellPasteHandlerOptions,
  parseClipboardTable,
  pasteRangeEdits,
  type PasteRangeOptions,
} from "./focus/pasteRange";
export {
  type SelectionStats,
  selectionStats,
  type SelectionStatsOptions,
} from "./focus/selectionStats";
export {
  GRID_CELL_ATTR,
  gridCellAttr,
  type GridFocusState,
  useGridFocus,
  type UseGridFocusOptions,
} from "./focus/useGridFocus";
export type { BaseDataTableProps } from "./props";
export {
  type AggregateFn,
  isFilterGroup,
  type QueryAggregate,
  type QueryCondition,
  type QueryExtensions,
  type QueryFilterGroup,
  type QuerySupport,
} from "./source/queryContract";
export {
  tableQueryBaseKey,
  tableQueryKey,
  type TableQueryKeyOptions,
} from "./source/queryKey";
export {
  type TableQuery,
  useServerData,
  type UseServerDataOptions,
} from "./source/useServerData";
export {
  isDeclarativeFilters,
  useTableData,
  type UseTableDataOptions,
  type UseTableDataResult,
} from "./source/useTableData";
export {
  type ChromeBodyData,
  type TableChrome,
  useChromeBodyData,
  useChromeScrollReset,
  useFilterTriggerToggle,
  useTableChrome,
} from "./useTableChrome";
export { humanizeKey } from "./utils/humanizeKey";
export { normalizeLocaleTag, resolveLocaleTag } from "./utils/localeTag";
export { getPath } from "./utils/path";

/* ── Labels ────────────────────────────────────────────────────────── */
export { defaultLabels, resolveLabels } from "./labels";

/* ── Constants ─────────────────────────────────────────────────────── */
export {
  DEFAULT_LIMIT,
  PAGE_SIZE_OPTIONS,
  pageSizeOptions,
  SEARCH_DEBOUNCE_MS,
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
  type SavedView,
  useSavedViews,
  type UseSavedViewsOptions,
  type UseSavedViewsResult,
} from "./url/useSavedViews";
export {
  useTableUrlState,
  type UseTableUrlStateOptions,
  type UseTableUrlStateResult,
} from "./url/useTableUrlState";

/* ── Shared render contracts ───────────────────────────────────────── */

/* ── Sources ───────────────────────────────────────────────────────── */
export type { TableSource } from "./source/TableSource";
export {
  defaultSearchText,
  useFrontendData,
  type UseFrontendDataOptions,
} from "./source/useFrontendData";
export {
  type InfiniteQueryLike,
  type PageSelector,
  useQuerySource,
  type UseQuerySourceOptions,
} from "./source/useQuerySource";
export type { TableStateMutators } from "./tableStateMutators";

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
export {
  compareValues,
  type SortLevel,
  sortRows,
  sortRowsMulti,
} from "./sort/compare";
export { nextSort } from "./sort/cycleSort";

/* ── Columns ───────────────────────────────────────────────────────── */
export {
  ACTIONS_COLUMN_KEY,
  columnMenuLabel,
  columnMenuRows,
} from "./columns/columnMenuModel";
export {
  columnDropProps,
  columnReorderKeyProps,
  columnRowDragProps,
  useColumnDragState,
} from "./columns/columnReorder";
export { columnResizeHandleProps } from "./columns/columnResize";
export {
  parsePxWidth,
  resolveColumnWidth,
  tableMinWidth,
} from "./columns/columnWidths";
export {
  type ColumnLayoutState,
  edgePinStyle,
  PIN_Z,
  pinnedCellStyle,
  type PinSide,
  useColumnLayout,
  type UseColumnLayoutOptions,
  type UseColumnLayoutResult,
} from "./columns/useColumnLayout";
export {
  type LayoutStorage,
  useColumnLayoutStorageState,
  type UseColumnLayoutStorageStateOptions,
  type UseColumnLayoutStorageStateResult,
} from "./columns/useColumnLayoutStorageState";
export { type TableLayout, visibleColumns } from "./columns/visibleColumns";
export { useHorizontalOverflow } from "./layout/useHorizontalOverflow";

/* ── Pagination ────────────────────────────────────────────────────── */
export {
  computePagination,
  type PaginationInfo,
} from "./pagination/paginationMath";

/* ── Hooks ─────────────────────────────────────────────────────────── */
export { useColorScheme } from "./hooks/useColorScheme";
export { useDebounce } from "./hooks/useDebounce";
export {
  useInfiniteScroll,
  type UseInfiniteScrollOptions,
} from "./hooks/useInfiniteScroll";
export { useIsMobile } from "./hooks/useIsMobile";
export { useMediaQuery } from "./hooks/useMediaQuery";
export { usePrefersReducedMotion } from "./hooks/usePrefersReducedMotion";
export {
  useScrollToTableTop,
  type UseScrollToTableTopOptions,
} from "./hooks/useScrollToTableTop";

/* ── Orchestrator ──────────────────────────────────────────────────── */
export {
  type CellElementProps,
  type RowElementProps,
  type SearchInputElementProps,
  type SortButtonElementProps,
  type TableElementProps,
  useDataTable,
  type UseDataTableOptions,
  type UseDataTableResult,
} from "./useDataTable/useDataTable";
export { useSearchInput } from "./useDataTable/useSearchInput";

/* ── Virtualization ───────────────────────────────────────────────── */
export {
  type TableVirtualization,
  useTableVirtualization,
  type UseTableVirtualizationOptions,
  windowGroupedEntries,
} from "./virtual/useTableVirtualization";

/* ── Utils ─────────────────────────────────────────────────────────── */
export { mergeProps, type Props } from "./utils/mergeProps";
export { stableKey } from "./utils/stableKey";

/* ── Rows ──────────────────────────────────────────────────────────── */

export {
  applyRowPatches,
  type InsertPatch,
  insertRow,
  type RemovePatch,
  removeRow,
  type RowPatch,
  type UpdatePatch,
  updateRow,
  type UpsertPatch,
  upsertRow,
} from "./rows/patch";
export {
  type RowExpansionState,
  useRowExpansion,
} from "./rows/useRowExpansion";

/* ── Inline cell editing ───────────────────────────────────────────── */
export {
  type CellEditCommit,
  type CellEditor,
  type CellEditorOption,
  type CellEditTarget,
  type EditableColumnLike,
  hasEditableColumns,
  isCellEditable,
  normalizeEditorOptions,
  parseCellEditValue,
  resolveCellEditor,
} from "./editing/cellEditing";
export {
  type EditableCellController,
  type EditableCellEditing,
  type EditableCellMode,
} from "./editing/editableCellController";
export {
  type EditableCellEditorCtrl,
  EditableCellGate,
  type EditableCellGateProps,
} from "./editing/EditableCellGate";
export {
  asGesture,
  type EditHistoryEntry,
  type EditHistoryState,
  readCellValue,
  type TableEditHistoryProps,
  useEditHistory,
  type UseEditHistoryOptions,
  useTableEditHistory,
} from "./editing/editHistory";
export {
  type CellEditingState,
  type CellEditKeyAction,
  type CellEditKeyOutcome,
  type CellEditNavigation,
  useCellEditing,
} from "./editing/useCellEditing";

/* ── Row grouping ──────────────────────────────────────────────────── */
export {
  formatGroupBy,
  type GroupByInput,
  parseGroupBy,
} from "./grouping/groupKeys";
export {
  groupAggregateEntries,
  groupLeafCount,
  type GroupRowCell,
  type GroupRowLayout,
  groupRowLayout,
} from "./grouping/groupRowLayout";
export {
  buildGroupedFlatModel,
  formatGroupLabel,
  type GroupAggregatesFn,
  type GroupedFlatEntry,
  type GroupNode,
  type GroupSort,
  groupValueKey,
} from "./grouping/groupRows";
export { groupSelectionState } from "./grouping/groupSelection";
export {
  type GroupCollapseState,
  useGroupCollapse,
} from "./grouping/useGroupCollapse";
export {
  type QueryGroupRow,
  type QueryGroupsPage,
  serverGroupEntries,
  type ServerGroupEntriesOptions,
} from "./source/queryGroups";
export {
  useGroupCollapseUrlState,
  type UseGroupCollapseUrlStateOptions,
  type UseGroupCollapseUrlStateResult,
} from "./url/useGroupCollapseUrlState";

/* ── Export (CSV, and any format a writer adds) ────────────────────── */
export {
  downloadCsv,
  matrixToCsv,
  rowsToCsv,
  type RowsToCsvOptions,
} from "./export/csv";
export {
  buildExportTable,
  csvWriter,
  downloadExportFile,
  type ExportPayload,
  type ExportTable,
  type ExportWriteContext,
  type ExportWriter,
} from "./export/exportWriter";
export {
  buildTableCsv,
  downloadTableCsv,
  exportableColumns,
  type ExportColumnScope,
  type ExportContext,
  type ExportCsvOptions,
  type ExportInfo,
  type ExportRowScope,
  makeExportCsvHandler,
  resolveExportColumns,
  resolveExportCsv,
} from "./export/tableCsv";
