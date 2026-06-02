/**
 * Pure helpers for reading and writing AdaptTable's URL state. Kept free
 * of React so they can be unit-tested directly and reused by any adapter.
 *
 * Conventions (compatible with shareable links):
 * - `page`, `limit`, `q`, `sortBy`, `sortDir` are top-level params.
 * - Extra (caller-defined) filters live under the `f_` prefix.
 * - Arrays serialise as comma-separated, percent-encoded values (so a value
 *   may itself contain a comma); numbers are parsed back.
 * - Default values are omitted to keep the URL clean.
 */
import type { ExtraFilters, FilterValue, SortDirection } from "../types";

/** Decode a URI component, tolerating malformed input from hand-edited URLs. */
function safeDecode(value: string): string {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export const PARAM_PAGE = "page";
export const PARAM_LIMIT = "limit";
export const PARAM_SEARCH = "q";
export const PARAM_SORT_BY = "sortBy";
export const PARAM_SORT_DIR = "sortDir";
/** Keys under this prefix flow through as-is into the `extra` bag. */
export const FILTER_PREFIX = "f_";

/** Read a 1-based page number, falling back when absent/invalid. */
export function readPage(params: URLSearchParams, fallback: number): number {
  const raw = params.get(PARAM_PAGE);
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

/** Read a page size, clamped to a sane range, falling back when invalid. */
export function readLimit(params: URLSearchParams, fallback: number): number {
  const raw = params.get(PARAM_LIMIT);
  const n = raw ? Number.parseInt(raw, 10) : Number.NaN;
  return Number.isFinite(n) && n > 0 && n <= 500 ? n : fallback;
}

/** Read a sort direction, or `undefined` when missing/invalid. */
export function readSortDir(
  params: URLSearchParams
): SortDirection | undefined {
  const raw = params.get(PARAM_SORT_DIR);
  return raw === "asc" || raw === "desc" ? raw : undefined;
}

/**
 * Read the `f_`-prefixed extra filters, applying number/array parsing for
 * the registered keys.
 */
export function readExtra(
  params: URLSearchParams,
  numberKeys: readonly string[],
  arrayKeys: readonly string[]
): ExtraFilters {
  const out: ExtraFilters = {};
  params.forEach((raw, key) => {
    if (!key.startsWith(FILTER_PREFIX) || raw === "") return;
    const bare = key.slice(FILTER_PREFIX.length);
    if (arrayKeys.includes(bare)) {
      const arr = raw
        .split(",")
        .map((v) => safeDecode(v).trim())
        .filter(Boolean);
      if (arr.length > 0) out[bare] = arr;
    } else if (numberKeys.includes(bare)) {
      const n = Number(raw);
      if (Number.isFinite(n)) out[bare] = n;
    } else {
      out[bare] = raw;
    }
  });
  return out;
}

/** True when a filter value should remove its param (empty/cleared). */
export function isEmptyFilterValue(value: FilterValue): boolean {
  if (value == null || value === "") return true;
  return Array.isArray(value) && value.length === 0;
}

/**
 * Write the full extra-filter bag into `params`, stripping any existing
 * `f_` entries first so cleared keys actually leave the URL.
 */
export function writeExtra(params: URLSearchParams, extra: ExtraFilters): void {
  // Collect existing filter keys first, then delete — mutating while
  // iterating the live key iterator would skip entries.
  const staleKeys: string[] = [];
  params.forEach((_, key) => {
    if (key.startsWith(FILTER_PREFIX)) staleKeys.push(key);
  });
  for (const key of staleKeys) params.delete(key);
  for (const [key, value] of Object.entries(extra)) {
    if (isEmptyFilterValue(value)) continue;
    const param = `${FILTER_PREFIX}${key}`;
    // Percent-encode each array element so a value may contain the comma
    // delimiter (and survives a single URLSearchParams decode round-trip).
    params.set(
      param,
      Array.isArray(value)
        ? value.map((v) => encodeURIComponent(String(v))).join(",")
        : String(value)
    );
  }
}
