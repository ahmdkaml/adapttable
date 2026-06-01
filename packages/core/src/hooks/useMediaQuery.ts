import { useCallback, useSyncExternalStore } from "react";

/**
 * SSR-safe `matchMedia` hook built on `useSyncExternalStore`. Returns
 * `false` on the server and before hydration, then the live match.
 *
 * @param query - A CSS media query string, e.g. `"(max-width: 768px)"`.
 * @param defaultValue - Value used when `matchMedia` is unavailable (SSR).
 * @returns Whether the query currently matches.
 */
export function useMediaQuery(query: string, defaultValue = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof globalThis.matchMedia !== "function") {
        return () => undefined;
      }
      const mql = globalThis.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    [query]
  );

  const getSnapshot = useCallback(() => {
    if (typeof globalThis.matchMedia !== "function") return defaultValue;
    return globalThis.matchMedia(query).matches;
  }, [query, defaultValue]);

  const getServerSnapshot = useCallback(() => defaultValue, [defaultValue]);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
