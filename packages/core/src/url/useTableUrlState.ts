import { useCallback, useMemo, useSyncExternalStore } from "react";

import { DEFAULT_LIMIT } from "../constants";
import type {
  ExtraFilters,
  FilterValue,
  SortDirection,
  TableQueryParams,
} from "../types";
import { type UrlStateAdapter, useResolvedAdapter } from "./adapter";
import {
  PARAM_LIMIT,
  PARAM_PAGE,
  PARAM_SEARCH,
  PARAM_SORT_BY,
  PARAM_SORT_DIR,
  readExtra,
  readLimit,
  readPage,
  readSortDir,
  writeExtra,
} from "./serialize";

/** Options for {@link useTableUrlState}. */
export interface UseTableUrlStateOptions {
  /**
   * URL-state backend. Defaults to the browser History API. Supply a
   * router-specific adapter (react-router / Next.js) to integrate with an
   * existing navigation stack.
   */
  adapter?: UrlStateAdapter;
  /**
   * When `false`, state is kept in a component-local memory store instead
   * of the URL — the table still works fully, it just isn't shareable.
   * Defaults to `true`.
   */
  enabled?: boolean;
  /** Initial values applied when the URL has no value for a key. */
  defaults?: Partial<TableQueryParams> & { extra?: ExtraFilters };
  /** Extra-filter keys whose values are parsed as numbers. */
  numberExtraKeys?: readonly string[];
  /** Extra-filter keys whose values are comma-separated arrays. */
  arrayExtraKeys?: readonly string[];
  /**
   * Namespace for this table's URL params, so multiple tables can share one
   * URL without colliding. With `urlKey="left"` the params become
   * `left.q`, `left.page`, `left.f_status`, … Omit for the bare keys.
   */
  urlKey?: string;
}

/** State + setters returned by {@link useTableUrlState}. */
export interface UseTableUrlStateResult {
  /** Current 1-based page. */
  page: number;
  /** Current page size. */
  limit: number;
  /** Current committed search term. */
  search: string;
  /** Active sort column key, if any. */
  sortBy: string | undefined;
  /** Active sort direction, if any. */
  sortDir: SortDirection | undefined;
  /** The extra-filter bag. */
  extra: ExtraFilters;
  /** Set the page. Page `1` is the default and is dropped from the URL. */
  setPage: (next: number) => void;
  /** Set the page size; resets to page 1. */
  setLimit: (next: number) => void;
  /** Set or clear the sort; resets to page 1. */
  setSort: (key: string | undefined, dir?: SortDirection) => void;
  /** Set or clear the search term; resets to page 1. */
  setSearch: (next: string) => void;
  /** Set a single extra filter; resets to page 1. */
  setExtra: (key: string, value: FilterValue) => void;
  /** Set several extra filters in one commit; resets to page 1. */
  setExtras: (updates: ExtraFilters) => void;
  /** Clear search, sort, page, and every extra filter in one commit. */
  clearAll: () => void;
}

/**
 * Headless URL-synced table state. Keeps page / limit / search / sort and
 * an arbitrary `extra` filter bag in the query string (or a local store
 * when disabled), so reloads, shared links, and back/forward all restore
 * the exact slice. Decoupled from any router via {@link UrlStateAdapter}.
 *
 * @param options - See {@link UseTableUrlStateOptions}.
 * @returns The current state and its setters.
 */
export function useTableUrlState(
  options: UseTableUrlStateOptions = {}
): UseTableUrlStateResult {
  const {
    adapter,
    enabled = true,
    defaults = {},
    numberExtraKeys = [],
    arrayExtraKeys = [],
    urlKey,
  } = options;
  // Per-table namespace, e.g. "left." → left.q / left.page / left.f_status.
  const ns = urlKey ? `${urlKey}.` : "";

  const resolved = useResolvedAdapter(adapter, enabled);
  const search = useSyncExternalStore(
    (onChange) => resolved.subscribe(onChange),
    () => resolved.getSearch(),
    () => resolved.getSearch()
  );
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const initialLimit = defaults.limit ?? DEFAULT_LIMIT;
  const page = readPage(params, defaults.page ?? 1, ns);
  const limit = readLimit(params, initialLimit, ns);
  const searchTerm = (
    params.get(ns + PARAM_SEARCH) ??
    defaults.search ??
    ""
  ).trim();
  const sortBy = params.get(ns + PARAM_SORT_BY) ?? defaults.sortBy;
  const sortDir = readSortDir(params, ns) ?? defaults.sortDir;
  const urlExtra = useMemo(
    () => readExtra(params, numberExtraKeys, arrayExtraKeys, ns),
    [params, numberExtraKeys, arrayExtraKeys, ns]
  );
  const extra = useMemo<ExtraFilters>(
    () => (defaults.extra ? { ...defaults.extra, ...urlExtra } : urlExtra),
    [defaults.extra, urlExtra]
  );

  const commit = useCallback(
    (mutate: (next: URLSearchParams) => void) => {
      const next = new URLSearchParams(resolved.getSearch());
      mutate(next);
      resolved.setSearch(next.toString());
    },
    [resolved]
  );

  const setPage = useCallback(
    (next: number) =>
      commit((p) => {
        if (next <= 1) p.delete(ns + PARAM_PAGE);
        else p.set(ns + PARAM_PAGE, String(next));
      }),
    [commit, ns]
  );

  const setLimit = useCallback(
    (next: number) =>
      commit((p) => {
        if (next === initialLimit) p.delete(ns + PARAM_LIMIT);
        else p.set(ns + PARAM_LIMIT, String(next));
        p.delete(ns + PARAM_PAGE);
      }),
    [commit, initialLimit, ns]
  );

  const setSearch = useCallback(
    (next: string) =>
      commit((p) => {
        const trimmed = next.trim();
        if (trimmed === "") p.delete(ns + PARAM_SEARCH);
        else p.set(ns + PARAM_SEARCH, trimmed);
        p.delete(ns + PARAM_PAGE);
      }),
    [commit, ns]
  );

  const setSort = useCallback(
    (key: string | undefined, dir: SortDirection = "asc") =>
      commit((p) => {
        if (key) {
          p.set(ns + PARAM_SORT_BY, key);
          p.set(ns + PARAM_SORT_DIR, dir);
        } else {
          p.delete(ns + PARAM_SORT_BY);
          p.delete(ns + PARAM_SORT_DIR);
        }
        p.delete(ns + PARAM_PAGE);
      }),
    [commit, ns]
  );

  const setExtra = useCallback(
    (key: string, value: FilterValue) =>
      commit((p) => {
        writeExtra(
          p,
          {
            ...readExtra(p, numberExtraKeys, arrayExtraKeys, ns),
            [key]: value,
          },
          ns
        );
        p.delete(ns + PARAM_PAGE);
      }),
    [commit, numberExtraKeys, arrayExtraKeys, ns]
  );

  const setExtras = useCallback(
    (updates: ExtraFilters) =>
      commit((p) => {
        writeExtra(
          p,
          {
            ...readExtra(p, numberExtraKeys, arrayExtraKeys, ns),
            ...updates,
          },
          ns
        );
        p.delete(ns + PARAM_PAGE);
      }),
    [commit, numberExtraKeys, arrayExtraKeys, ns]
  );

  const clearAll = useCallback(
    () =>
      commit((p) => {
        p.delete(ns + PARAM_SEARCH);
        p.delete(ns + PARAM_SORT_BY);
        p.delete(ns + PARAM_SORT_DIR);
        p.delete(ns + PARAM_PAGE);
        writeExtra(p, {}, ns);
      }),
    [commit, ns]
  );

  return {
    page,
    limit,
    search: searchTerm,
    sortBy,
    sortDir,
    extra,
    setPage,
    setLimit,
    setSort,
    setSearch,
    setExtra,
    setExtras,
    clearAll,
  };
}
