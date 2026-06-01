import { useMemo } from "react";

import { type ConfirmHandler, defaultConfirm } from "./actions/confirm";
import type { ActiveFilterChip } from "./filters/useActiveFilterChips";
import { useIsMobile } from "./hooks/useIsMobile";
import type { BaseDataTableProps } from "./props";
import {
  useDataTable,
  type UseDataTableResult,
} from "./useDataTable/useDataTable";

/** Which body region a {@link DataTable} should render. */
export type TableBody = "skeleton" | "empty" | "mobile" | "desktop";

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
  body: TableBody;
  /** Whether the paged footer should render. */
  showFooter: boolean;
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
    bulkActions,
    selectionGetId,
    filterLabels,
    extraChips,
    activeFilterCount: activeFilterCountProp,
    confirm: confirmProp,
  } = props;

  const autoMobile = useIsMobile();
  const isMobile = isMobileProp ?? autoMobile;
  const confirm = confirmProp ?? defaultConfirm;

  const table = useDataTable<TRow>({
    source,
    columns,
    rowKey,
    tableLabel,
    labels,
    dir,
    isMobile,
    bulkActions,
    selectionGetId,
    filterLabels,
  });

  const mergedChips = useMemo<readonly ActiveFilterChip[]>(() => {
    if (!extraChips?.length) return table.filterChips;
    if (table.filterChips.length === 0) return extraChips;
    return [...table.filterChips, ...extraChips];
  }, [table.filterChips, extraChips]);

  const activeFilterCount =
    activeFilterCountProp && activeFilterCountProp > 0
      ? activeFilterCountProp
      : mergedChips.length;

  const isPaged = source.paginationMode === "paged";

  let body: TableBody;
  if (source.isLoading && source.rows.length === 0) body = "skeleton";
  else if (table.isEmpty) body = "empty";
  else if (isMobile) body = "mobile";
  else body = "desktop";

  const showFooter =
    isPaged && !source.error && (source.total > 0 || source.isLoading);

  return {
    table,
    isMobile,
    confirm,
    getRowId: selectionGetId ?? rowKey,
    mergedChips,
    activeFilterCount,
    isPaged,
    body,
    showFooter,
  };
}
