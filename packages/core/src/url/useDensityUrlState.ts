/**
 * Density in the URL, so a chosen layout survives a reload and a shared
 * link.
 *
 * Density is a display preference, and display preferences that live only
 * in memory are the ones people re-set every morning. It sits in the URL
 * with sort, filters and column layout for the same reason those do: the
 * table's visible state should be reproducible by sending someone a link.
 *
 * The host stays in control. Pass `density` and this hook is inert — a
 * controlled table's density is the host's business, and a URL that
 * silently overrode it would be a second source of truth.
 */
import { useCallback, useMemo, useState, useSyncExternalStore } from "react";

import { type UrlStateAdapter, useResolvedAdapter } from "./adapter";

/** The two layouts a table has. */
export type Density = "comfortable" | "compact";

/** What {@link useDensityUrlState} needs. */
export interface UseDensityUrlStateOptions {
  urlAdapter?: UrlStateAdapter;
  urlSync?: boolean;
  urlKey?: string;
  /** The density before anyone has chosen one. Defaults to comfortable. */
  defaultDensity?: Density;
}

/** The controlled pair to spread onto the table. */
export interface UseDensityUrlStateResult {
  density: Density;
  onDensityChange: (next: Density) => void;
}

function readDensity(params: URLSearchParams, ns: string): Density | undefined {
  const raw = params.get(`${ns}density`);
  return raw === "compact" || raw === "comfortable" ? raw : undefined;
}

/**
 * Keep the table's density in the URL.
 *
 * @param options - See {@link UseDensityUrlStateOptions}.
 * @returns The controlled pair to spread onto the table.
 */
export function useDensityUrlState(
  options: UseDensityUrlStateOptions = {}
): UseDensityUrlStateResult {
  const { urlAdapter, urlSync, urlKey, defaultDensity } = options;
  const ns = urlKey ? `${urlKey}.` : "";
  const resolved = useResolvedAdapter(urlAdapter, urlSync ?? true);
  // Same SSR rule as the other URL hooks: only an explicit adapter is
  // trusted to be hydration-consistent.
  const search = useSyncExternalStore(
    (onChange) => resolved.subscribe(onChange),
    () => resolved.getSearch(),
    () => (urlAdapter ? urlAdapter.getSearch() : "")
  );
  // The click that has not reached the URL yet.
  const [pending, setPending] = useState<Density | null>(null);

  const density = useMemo(() => {
    if (pending) return pending;
    return (
      readDensity(new URLSearchParams(search), ns) ??
      defaultDensity ??
      "comfortable"
    );
  }, [pending, search, ns, defaultDensity]);

  const onDensityChange = useCallback(
    (next: Density) => {
      setPending(next);
      const params = new URLSearchParams(resolved.getSearch());
      // The default writes no parameter: a URL should carry what someone
      // chose, not restate what the table would have done anyway.
      if (next === (defaultDensity ?? "comfortable")) {
        params.delete(`${ns}density`);
      } else {
        params.set(`${ns}density`, next);
      }
      resolved.setSearch(params.toString());
      setPending(null);
    },
    [resolved, ns, defaultDensity]
  );

  return { density, onDensityChange };
}
