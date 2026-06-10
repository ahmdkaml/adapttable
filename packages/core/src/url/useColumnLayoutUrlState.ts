import { useCallback, useMemo, useSyncExternalStore } from "react";

import {
  type ColumnLayoutState,
  EMPTY_COLUMN_LAYOUT,
} from "../columns/useColumnLayout";
import { stableKey } from "../utils/stableKey";
import { type UrlStateAdapter, useResolvedAdapter } from "./adapter";
import {
  PARAM_COL_HIDDEN,
  readColumnLayout,
  writeColumnLayout,
} from "./serialize";

/** Options for {@link useColumnLayoutUrlState}. */
export interface UseColumnLayoutUrlStateOptions {
  /** URL-state backend. Defaults to the browser History API. */
  adapter?: UrlStateAdapter;
  /** When `false`, keep the layout in a local memory store. Defaults `true`. */
  enabled?: boolean;
  /** Layout applied when the URL carries no column layout yet. */
  defaultLayout?: Partial<ColumnLayoutState>;
  /**
   * Namespace for this table's params, so multiple tables can share one URL
   * (`left.colHide`, `right.colPin`, …). Omit for the bare keys.
   */
  urlKey?: string;
}

/** State + change handler returned by {@link useColumnLayoutUrlState}. */
export interface UseColumnLayoutUrlStateResult {
  /** Current layout — from the URL, or the default when the URL is empty. */
  layout: ColumnLayoutState;
  /** Persist a new layout into the URL. Wire to `onColumnLayoutChange`. */
  onLayoutChange: (next: ColumnLayoutState) => void;
}

/**
 * Headless URL-synced column layout. Mirrors {@link useTableUrlState} for the
 * column dimension: which columns are hidden, pinned, reordered, or resized is
 * kept in the query string (or a local store when disabled), so reloads,
 * shared links, and re-mounts restore the exact layout. Feed the result into
 * a table's `columnLayout` / `onColumnLayoutChange`.
 *
 * `defaultLayout` applies only while the URL carries no layout. When the user
 * explicitly empties the layout (e.g. unhides the last default-hidden
 * column), an empty `colHide=` marker records that emptiness — deleting every
 * param would resurrect the default on the next read. A change back to the
 * exact default clears the params instead, keeping shared URLs clean.
 *
 * @param options - See {@link UseColumnLayoutUrlStateOptions}.
 * @returns The current layout and a change handler that persists it.
 */
export function useColumnLayoutUrlState(
  options: UseColumnLayoutUrlStateOptions = {}
): UseColumnLayoutUrlStateResult {
  const { adapter, enabled = true, defaultLayout, urlKey } = options;
  const ns = urlKey ? `${urlKey}.` : "";

  const resolved = useResolvedAdapter(adapter, enabled);
  // Same SSR rule as useTableUrlState: only an explicit adapter is trusted
  // to be hydration-consistent; the default history adapter hydrates from "".
  const search = useSyncExternalStore(
    (onChange) => resolved.subscribe(onChange),
    () => resolved.getSearch(),
    () => (adapter ? adapter.getSearch() : "")
  );
  const params = useMemo(() => new URLSearchParams(search), [search]);

  const fallback = useMemo<ColumnLayoutState>(
    () => ({ ...EMPTY_COLUMN_LAYOUT, ...defaultLayout }),
    [defaultLayout]
  );
  const layout = useMemo<ColumnLayoutState>(
    () => readColumnLayout(params, ns) ?? fallback,
    [params, ns, fallback]
  );

  const onLayoutChange = useCallback(
    (next: ColumnLayoutState) => {
      const p = new URLSearchParams(resolved.getSearch());
      const isDefault = stableKey(next) === stableKey(fallback);
      const isEmpty = stableKey(next) === stableKey(EMPTY_COLUMN_LAYOUT);
      // Back to the exact default → drop the params; the default re-applies
      // and shared URLs stay clean.
      writeColumnLayout(p, isDefault ? EMPTY_COLUMN_LAYOUT : next, ns);
      // An all-empty layout writes no params, which reads back as "use the
      // default" — stamp a marker so an explicitly emptied layout sticks.
      if (isEmpty && !isDefault) p.set(ns + PARAM_COL_HIDDEN, "");
      resolved.setSearch(p.toString());
    },
    [resolved, ns, fallback]
  );

  return { layout, onLayoutChange };
}
