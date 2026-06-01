import { useCallback, useMemo } from "react";

import { resolvePaginationMode, useIsMobile } from "../hooks/useIsMobile";
import { sortRows } from "../sort/compare";
import type { ColumnDef, PaginationMode, SortableValue } from "../types";
import {
  useTableUrlState,
  type UseTableUrlStateOptions,
} from "../url/useTableUrlState";
import type { TableSource } from "./TableSource";

/** Options for {@link useFrontendData}. */
export interface UseFrontendDataOptions<TRow> extends Pick<
  UseTableUrlStateOptions,
  "adapter" | "enabled" | "defaults" | "numberExtraKeys" | "arrayExtraKeys"
> {
  /** The source array. Filtered / sorted / sliced internally by state. */
  data: readonly TRow[];
  /**
   * Project a row to its searchable text. Defaults to a flatten of the
   * row's own values; override to reach nested fields.
   */
  getSearchText?: (row: TRow) => string;
  /**
   * Resolve a row's sort value for a column key. Falls back to the
   * matching column's `sortValue`.
   */
  getSortValue?: (row: TRow, columnKey: string) => SortableValue;
  /** Columns — read for per-column `sortValue` when sorting. */
  columns?: readonly ColumnDef<TRow>[];
  /** Pagination mode. Defaults to `"auto"` (mobile → infinite). */
  paginationMode?: PaginationMode;
  /** Forwarded error to display (e.g. from the query that produced `data`). */
  error?: Error | null;
  /** Forwarded refetch. */
  refetch?: () => Promise<unknown> | void;
  /** Forwarded fetching flag. */
  isFetching?: boolean;
  /** Forwarded loading flag. */
  isLoading?: boolean;
  /**
   * Force the resolved mobile state instead of using a media query.
   * Primarily a testing/SSR seam.
   */
  forceMobile?: boolean;
}

/** Default searchable-text projector: flatten a row's own values. */
export function defaultSearchText<TRow>(row: TRow): string {
  if (row && typeof row === "object") {
    return Object.values(row)
      .map((v) => {
        if (v == null) return "";
        if (typeof v === "object") return JSON.stringify(v);
        return String(v as string | number | boolean);
      })
      .join(" ");
  }
  return String(row ?? "");
}

/**
 * In-memory {@link TableSource}: reads URL/local state and filters, sorts,
 * and slices a caller-supplied array. The mirror of `useBackendData` —
 * the table cannot tell which produced it.
 *
 * @typeParam TRow - The row item type.
 * @param options - See {@link UseFrontendDataOptions}.
 * @returns A {@link TableSource} over the in-memory data.
 */
export function useFrontendData<TRow>(
  options: UseFrontendDataOptions<TRow>
): TableSource<TRow> {
  const {
    data,
    getSearchText = defaultSearchText,
    getSortValue,
    columns,
    paginationMode = "auto",
    error = null,
    refetch,
    isFetching = false,
    isLoading = false,
    forceMobile,
    ...urlOptions
  } = options;

  const mediaMobile = useIsMobile();
  const isMobile = forceMobile ?? mediaMobile;
  const resolvedMode = resolvePaginationMode(paginationMode, isMobile);
  const paged = resolvedMode === "paged";

  const state = useTableUrlState(urlOptions);
  const { page, limit, search, sortBy, sortDir } = state;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return data;
    return data.filter((row) =>
      getSearchText(row).toLowerCase().includes(term)
    );
  }, [data, search, getSearchText]);

  const sorted = useMemo(() => {
    if (!sortBy || !sortDir) return filtered;
    const column = columns?.find((c) => c.key === sortBy);
    const resolve = (row: TRow): SortableValue =>
      getSortValue
        ? getSortValue(row, sortBy)
        : (column?.sortValue?.(row) ?? null);
    return sortRows(filtered, resolve, sortDir);
  }, [filtered, sortBy, sortDir, getSortValue, columns]);

  const total = sorted.length;
  const lastPage = Math.max(1, Math.ceil(total / Math.max(limit, 1)));
  const safePage = Math.min(Math.max(page, 1), lastPage);

  const rows = useMemo<readonly TRow[]>(() => {
    if (paged) {
      const start = (safePage - 1) * limit;
      return sorted.slice(start, start + limit);
    }
    return sorted.slice(0, safePage * limit);
  }, [sorted, paged, safePage, limit]);

  const hasNextPage = !paged && safePage * limit < total;

  const fetchNextPage = useCallback(() => {
    if (paged || safePage * limit >= total) return;
    state.setPage(safePage + 1);
  }, [paged, safePage, limit, total, state]);

  return {
    rows,
    total,
    isLoading,
    isFetching,
    isFetchingNextPage: false,
    hasNextPage,
    fetchNextPage,
    error,
    refetch,
    paginationMode: resolvedMode,
    page: safePage,
    limit,
    search,
    sortBy,
    sortDir,
    extra: state.extra,
    setPage: state.setPage,
    setLimit: state.setLimit,
    setSort: state.setSort,
    setSearch: state.setSearch,
    setExtra: state.setExtra,
    setExtras: state.setExtras,
    clearAll: state.clearAll,
  };
}
