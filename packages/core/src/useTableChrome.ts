import type { ReactNode, RefObject } from "react";
import { useCallback, useEffect, useMemo, useRef } from "react";

import { type ConfirmHandler, defaultConfirm } from "./actions/confirm";
import { resolveColumns } from "./columns/resolveColumns";
import {
  useColumnLayout,
  type UseColumnLayoutResult,
} from "./columns/useColumnLayout";
import { DEFAULT_CARD_SIZE_PX, DEFAULT_ROW_SIZE_PX } from "./constants";
import {
  type ActiveFilterChip,
  mergeFilterChips,
  resolveActiveFilterCount,
} from "./filters/useActiveFilterChips";
import { useInfiniteScroll } from "./hooks/useInfiniteScroll";
import { useIsMobile } from "./hooks/useIsMobile";
import { useScrollToTableTop } from "./hooks/useScrollToTableTop";
import type { BaseDataTableProps } from "./props";
import {
  type RowExpansionState,
  useRowExpansion,
} from "./rows/useRowExpansion";
import type { SelectionState } from "./selection/useSelection";
import type { BulkAction, ColumnDef, SortByOption, TableLabels } from "./types";
import {
  useDataTable,
  type UseDataTableResult,
} from "./useDataTable/useDataTable";
import { devWarn } from "./utils/devWarn";
import {
  type TableVirtualization,
  useTableVirtualization,
  warnVirtualizeInScrollBox,
} from "./virtual/useTableVirtualization";

/**
 * The shared prop surface every adapter's toolbar sub-component needs.
 * Adapters render kit-specific markup from this; extracting it keeps the
 * identical shape from being re-declared (and flagged as duplication) in
 * each adapter.
 *
 * @typeParam TRow - The row type.
 */
export interface ToolbarChromeProps<TRow> {
  /** The headless table state + prop-getters. */
  table: UseDataTableResult<TRow>;
  /** Hide the search input. */
  hideSearch?: boolean;
  /** Placeholder for the search input. */
  searchPlaceholder?: string;
  /** Options for an explicit sort-by control. */
  sortByOptions?: SortByOption[];
  /** Extra caller-supplied toolbar content. */
  customToolbar?: ReactNode;
  /** Whether a filters affordance should render. */
  hasFilters: boolean;
  /** Number shown on the filters badge. */
  activeFilterCount: number;
  /** Whether the filter container is open (drives `aria-expanded`). */
  filtersOpen: boolean;
  /** Toggle the filter container (popover and drawer alike). */
  onToggleFilters: () => void;
  /**
   * Bind to the trigger's `onPointerDown` (see
   * {@link useFilterTriggerToggle}) so a click on the open trigger CLOSES
   * the popover instead of racing the kit's outside-close and reopening.
   */
  onFiltersTriggerPointerDown?: () => void;
  /** Whether to show the rows-per-page control (infinite mode). */
  showRowsPerPage: boolean;
  /** Built column-menu node, when `enableColumnMenu` is set. */
  columnMenu?: ReactNode;
  /** Text direction, for adapters whose toolbar needs explicit RTL hints. */
  dir?: "ltr" | "rtl";
}

/**
 * The shared prop surface every adapter's bulk-action bar needs. Extracted
 * so the identical shape isn't re-declared (and flagged as duplication) in
 * each adapter's chrome.
 */
export interface BulkBarChromeProps {
  /** Current selection state. */
  selection: SelectionState;
  /**
   * Total rows in the filtered set — drives the "select all N matching"
   * banner when a full page is selected and more rows match elsewhere.
   */
  total: number;
  /** Caller-supplied bulk actions. */
  bulkActions: BulkAction[];
  /** Confirmation handler for actions that declare a `confirm` block. */
  confirm: ConfirmHandler;
  /** Resolved labels. */
  labels: Required<TableLabels>;
}

/**
 * Which body region a `DataTable` should render. Named `TableBodyRegion`
 * (not `TableBody`) so it never collides with MUI's `TableBody` component
 * in consumer imports.
 */
export type TableBodyRegion = "skeleton" | "empty" | "mobile" | "desktop";

/** The shared, UI-agnostic orchestration result for an adapter table. */
export interface TableChrome<TRow> {
  /** The headless table state + prop-getters. */
  table: UseDataTableResult<TRow>;
  /** Resolved mobile layout flag. */
  isMobile: boolean;
  /** Resolved confirmation handler. */
  confirm: ConfirmHandler;
  /** Row id extractor (selection id, falling back to rowKey). */
  getRowId: (row: TRow) => string;
  /** Derived chips: label-driven merged with caller `extraChips`. */
  mergedChips: readonly ActiveFilterChip[];
  /** Active filter count (override, or merged chip count). */
  activeFilterCount: number;
  /** Whether the resolved pagination mode is `"paged"`. */
  isPaged: boolean;
  /** Which body region to render. */
  body: TableBodyRegion;
  /**
   * Why the body is empty: `"noResults"` when an active search/filter
   * produced zero rows (offer a clear-filters CTA), `"noData"` when the
   * source itself is empty. Only meaningful while `body === "empty"`.
   */
  emptyVariant: "noData" | "noResults";
  /**
   * A background refresh is in flight (`isFetching` without `isLoading`):
   * rows on screen are potentially stale. Adapters show a subtle,
   * non-blocking indicator (thin progress bar / `aria-busy`).
   */
  isRefreshing: boolean;
  /**
   * Clear-filters handler: the caller's `onClearFilters`, falling back to
   * `source.clearExtras` — so chips, the drawer and the no-results CTA can
   * always offer a working "clear".
   */
  clearFilters: () => void;
  /** Row-expansion state — present only when `renderRowDetail` is set. */
  expansion?: RowExpansionState;
  /** Whether the paged footer should render. */
  showFooter: boolean;
  /** User column-layout state + mutators (visibility, order, …). */
  columnLayout: UseColumnLayoutResult<TRow>;
  /** All declared columns (pre layout/device filtering) for the column menu. */
  allColumns: ColumnDef<TRow>[];
}

/**
 * Run the shared orchestration every adapter `<DataTable>` needs: resolve
 * the layout + confirm handler, build the headless table, merge filter
 * chips, compute the active-filter count, and decide which body region and
 * footer to show. Adapters then render their kit-specific markup from this.
 *
 * @typeParam TRow - The row type.
 * @param props - The adapter's {@link BaseDataTableProps}.
 * @returns The {@link TableChrome} orchestration result.
 */
export function useTableChrome<TRow>(
  props: BaseDataTableProps<TRow>
): TableChrome<TRow> {
  const {
    source,
    columns,
    rowKey,
    tableLabel,
    labels,
    dir,
    isMobile: isMobileProp,
    mobileIdentityColumns,
    onRowsChange,
    bulkActions,
    selectionGetId,
    selectedIds: selectedIdsProp,
    onSelectionChange,
    filterLabels,
    onClearFilters,
    extraChips,
    activeFilterCount: activeFilterCountProp,
    confirm: confirmProp,
    columnLayout: columnLayoutProp,
    onColumnLayoutChange,
    defaultColumnLayout,
  } = props;

  const autoMobile = useIsMobile();
  const isMobile = isMobileProp ?? autoMobile;
  const confirm = confirmProp ?? defaultConfirm;

  // Declarative defaults (auto headers, dot-path accessors) resolve once
  // here, so the layout, the column menu and the table all see them.
  const resolvedColumns = useMemo(
    () => resolveColumns(columns, props.locale),
    [columns, props.locale]
  );

  // User column layout (hide/order/…) applied on top of the declared columns,
  // before device filtering inside useDataTable. The menu uses `allColumns`.
  const columnLayout = useColumnLayout<TRow>({
    columns: resolvedColumns,
    layout: columnLayoutProp,
    onLayoutChange: onColumnLayoutChange,
    defaultLayout: defaultColumnLayout,
  });

  const table = useDataTable<TRow>({
    source,
    columns: columnLayout.visibleColumns,
    rowKey,
    tableLabel,
    labels,
    dir,
    isMobile,
    mobileIdentityColumns,
    bulkActions,
    selectionGetId,
    selectedIds: selectedIdsProp,
    onSelectedIdsChange: onSelectionChange,
    filterLabels,
  });

  useEffect(() => {
    onRowsChange?.(table.rows);
  }, [onRowsChange, table.rows]);

  // Selection observer (uncontrolled only): the Set identity only changes
  // when the selection does, so this fires exactly once per user-visible
  // change (including automatic resets). In the CONTROLLED mode the parent
  // already receives change requests synchronously through useSelection's
  // onChange — echoing them here would double-fire (and feed loops).
  const controlledSelection = selectedIdsProp !== undefined;
  const selectedIds = table.selection?.selectedIds;
  useEffect(() => {
    if (!controlledSelection && selectedIds) {
      onSelectionChange?.([...selectedIds]);
    }
  }, [controlledSelection, onSelectionChange, selectedIds]);

  const mergedChips = useMemo<readonly ActiveFilterChip[]>(
    () => mergeFilterChips(table.filterChips, extraChips),
    [table.filterChips, extraChips]
  );

  const activeFilterCount = resolveActiveFilterCount(
    activeFilterCountProp,
    mergedChips.length
  );

  const isPaged = source.paginationMode === "paged";

  let body: TableBodyRegion;
  if (source.isLoading && source.rows.length === 0) body = "skeleton";
  else if (table.isEmpty) body = "empty";
  else if (isMobile) body = "mobile";
  else body = "desktop";

  // Zero rows under an active search/filter is "nothing MATCHED", not
  // "nothing exists" — the empty state should say so and offer a clear.
  const emptyVariant =
    activeFilterCount > 0 || source.search !== "" ? "noResults" : "noData";

  // `isFetchingNextPage` is load-more, not a refresh of what's on screen.
  const isRefreshing = Boolean(
    source.isFetching && !source.isLoading && !source.isFetchingNextPage
  );

  const clearFilters = useCallback(() => {
    if (onClearFilters) onClearFilters();
    else source.clearExtras();
  }, [onClearFilters, source]);

  // Hooks run unconditionally; the state is simply unused (and unexposed)
  // when the caller renders no row details.
  const expansionState = useRowExpansion();
  const expansion = props.renderRowDetail ? expansionState : undefined;

  const showFooter =
    isPaged &&
    !source.error &&
    (source.total > 0 || source.isLoading || source.isFetching);

  return {
    table,
    isMobile,
    confirm,
    getRowId: selectionGetId ?? rowKey,
    mergedChips,
    activeFilterCount,
    isPaged,
    body,
    emptyVariant,
    isRefreshing,
    clearFilters,
    expansion,
    showFooter,
    columnLayout,
    allColumns: resolvedColumns,
  };
}

/** Result of {@link useChromeBodyData}. */
export interface ChromeBodyData<TRow> {
  /** Row/card window virtualization state (disabled unless eligible). */
  virtualization: TableVirtualization<TRow>;
  /** Sentinel ref that auto-loads the next page in infinite mode. */
  loadMoreRef: RefObject<HTMLDivElement>;
  /** Whether the load-more affordance applies (infinite mode, no error). */
  canLoadMore: boolean;
}

/**
 * The shared data-flow wiring between {@link useTableChrome} and an
 * adapter's body: window virtualization (eligible only for real rows in
 * infinite mode) and the infinite-scroll sentinel. Extracted because four
 * adapters repeated this block verbatim; antd opts out (it scrolls inside
 * its own `<Table>` container).
 *
 * @typeParam TRow - The row type.
 * @param chrome - The {@link useTableChrome} result.
 * @param props - The adapter's {@link BaseDataTableProps}.
 * @returns Virtualization state + the load-more sentinel.
 */
export function useChromeBodyData<TRow>(
  chrome: TableChrome<TRow>,
  props: BaseDataTableProps<TRow>
): ChromeBodyData<TRow> {
  const { source, rowKey, virtualize = false } = props;
  warnVirtualizeInScrollBox(virtualize, props.maxHeight);
  if (virtualize && props.renderRowDetail) {
    devWarn(
      "renderRowDetail with virtualize: desktop detail panels render as unmeasured sibling rows, so scroll heights can drift — prefer paged data with row details."
    );
  }
  // One guarded loader for both triggers (virtual end + sentinel).
  const fetchNext = useCallback(() => {
    if (source.hasNextPage && !source.isFetchingNextPage) {
      source.fetchNextPage();
    }
  }, [source]);
  const virtualization = useTableVirtualization({
    rows: source.rows,
    rowKey,
    enabled:
      virtualize &&
      !chrome.isPaged &&
      !source.error &&
      (chrome.body === "desktop" || chrome.body === "mobile"),
    estimateSize: chrome.isMobile
      ? (props.estimateCardSize ?? DEFAULT_CARD_SIZE_PX)
      : (props.estimateRowSize ?? DEFAULT_ROW_SIZE_PX),
    overscan: props.virtualOverscan,
    scrollMargin: props.virtualScrollMargin,
    onEndReached: fetchNext,
  });
  const canLoadMore = !chrome.isPaged && !source.error;
  const loadMoreRef = useInfiniteScroll<HTMLDivElement>({
    hasNextPage: Boolean(source.hasNextPage),
    isFetchingNextPage: Boolean(source.isFetchingNextPage),
    fetchNextPage: fetchNext,
    itemCount: source.rows.length,
    enabled: canLoadMore,
  });
  return { virtualization, loadMoreRef, canLoadMore };
}

/**
 * The shared scroll-restoration wiring every adapter `<DataTable>` needs:
 * when search / sort / page / filters change, scroll the table back below
 * the sticky chrome. Extracted so the identical block isn't repeated (and
 * flagged as duplication) in each adapter.
 *
 * @typeParam TRow - The row type.
 * @param ref - The adapter's root element.
 * @param chrome - The {@link useTableChrome} result.
 * @param props - The adapter's {@link BaseDataTableProps}.
 */
export function useChromeScrollReset<TRow>(
  ref: RefObject<HTMLElement | null>,
  chrome: TableChrome<TRow>,
  props: BaseDataTableProps<TRow>
): void {
  const { source } = props;
  useScrollToTableTop({
    ref,
    deps: [
      source.search,
      source.sortBy ?? "",
      source.sortDir ?? "",
      source.page,
      chrome.activeFilterCount,
    ],
    enabled: props.scrollToTopOnChange,
    offset: props.stickyTop,
    gap: props.scrollTopGap,
  });
}

/** Pointer/click handlers returned by {@link useFilterTriggerToggle}. */
export interface FilterTriggerToggle {
  onPointerDown: () => void;
  onClick: () => void;
}

/**
 * A toggle for the Filters trigger that survives every kit's outside-close
 * behavior. Some kits (Chakra `closeOnBlur`, outside `mousedown` handlers)
 * close the popover on the trigger's own pointer-down — a plain
 * `setOpen(o => !o)` on click then instantly REOPENS it, so the button can
 * never close the popover. This records whether the popover was open at
 * pointer-down: if the kit closed it in between, the click is swallowed;
 * otherwise the click toggles normally (kits that exclude the trigger from
 * outside-close keep working unchanged).
 */
export function useFilterTriggerToggle(
  open: boolean,
  setOpen: (next: boolean | ((current: boolean) => boolean)) => void
): FilterTriggerToggle {
  const wasOpenAtPointerDown = useRef(false);
  return {
    onPointerDown: useCallback(() => {
      wasOpenAtPointerDown.current = open;
    }, [open]),
    onClick: useCallback(() => {
      const closedByKit = wasOpenAtPointerDown.current && !open;
      wasOpenAtPointerDown.current = false;
      if (closedByKit) return;
      setOpen((current) => !current);
    }, [open, setOpen]),
  };
}
