/**
 * The pivot configuration in the URL, so a built pivot survives a reload and
 * can be sent to someone.
 *
 * A pivot is the most expensive table state there is to rebuild by hand —
 * two axes, an order on each, and a measure list — which makes it the state
 * most worth putting in a link. It sits alongside sort, filters and column
 * layout for exactly the reason those do.
 *
 * The encoding itself is in {@link ./pivotUrlCodec}, which this hook reads
 * and writes through: a browser is only one end of a shared link, and the
 * other end is a server that never renders.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { type UrlStateAdapter, useResolvedAdapter } from "../url/adapter";
import { PARAM_PIVOT } from "../url/serialize";
import { EMPTY_PIVOT_CONFIG } from "./pivotConfigModel";
import type { PivotConfig } from "./pivotModel";
import { deserializePivot, serializePivot } from "./pivotUrlCodec";

/** What {@link usePivotUrlState} needs. */
export interface UsePivotUrlStateOptions {
  urlAdapter?: UrlStateAdapter;
  urlSync?: boolean;
  urlKey?: string;
  /** The pivot before anyone has built one. Defaults to empty. */
  defaultConfig?: PivotConfig;
}

/** The controlled pair to hand the panel and the engine. */
export interface UsePivotUrlStateResult {
  config: PivotConfig;
  onConfigChange: (next: PivotConfig) => void;
}

/**
 * Keep the pivot configuration in the URL.
 *
 * @param options - See {@link UsePivotUrlStateOptions}.
 * @returns The configuration and the setter to give the panel.
 */
export function usePivotUrlState(
  options: UsePivotUrlStateOptions = {}
): UsePivotUrlStateResult {
  const { urlAdapter, urlSync, urlKey, defaultConfig } = options;
  const ns = urlKey ? `${urlKey}.` : "";
  const resolved = useResolvedAdapter(urlAdapter, urlSync ?? true);
  // Same SSR rule as the other URL hooks: only an explicit adapter is
  // trusted to be hydration-consistent.
  const search = useSyncExternalStore(
    (onChange) => resolved.subscribe(onChange),
    () => resolved.getSearch(),
    () => (urlAdapter ? urlAdapter.getSearch() : "")
  );
  // The change that has not reached the URL yet.
  const [pending, setPending] = useState<PivotConfig | null>(null);

  const config = useMemo(() => {
    if (pending) return pending;
    const raw = new URLSearchParams(search).get(`${ns}${PARAM_PIVOT}`);
    if (raw === null) return defaultConfig ?? EMPTY_PIVOT_CONFIG;
    return deserializePivot(raw);
  }, [pending, search, ns, defaultConfig]);

  const onConfigChange = useCallback(
    (next: PivotConfig) => {
      setPending(next);
      const params = new URLSearchParams(resolved.getSearch());
      const value = serializePivot(next);
      // An empty pivot writes no parameter: a URL should carry what someone
      // built, not restate the nothing the table starts with.
      if (value === "") params.delete(`${ns}${PARAM_PIVOT}`);
      else params.set(`${ns}${PARAM_PIVOT}`, value);
      resolved.setSearch(params.toString());
      setPending(null);
    },
    [resolved, ns]
  );

  return { config, onConfigChange };
}
