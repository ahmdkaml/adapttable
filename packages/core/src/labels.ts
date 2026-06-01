import type { TableLabels } from "./types";

/**
 * English default strings. Consumers override any subset via the
 * `labels` option; {@link resolveLabels} merges their overrides on top.
 */
export const defaultLabels: Required<TableLabels> = {
  search: "Search",
  searchPlaceholder: "Search…",
  noData: "No data",
  loading: "Loading…",
  loadMore: "Load more",
  filters: "Filters",
  clearAll: "Clear all",
  applyFilters: "Apply filters",
  sortBy: "Sort by",
  rowsPerPage: "Rows per page",
  actions: "Actions",
  selectAll: "Select all",
  selectRow: "Select row",
  cancel: "Cancel",
  retry: "Retry",
  errorTitle: "Something went wrong",
  errorMessage: "We couldn't load this data.",
  previousPage: "Previous page",
  nextPage: "Next page",
  selectedCount: (count) => `${count} selected`,
  showing: ({ from, to, total }) => `Showing ${from}–${to} of ${total}`,
  pageOf: ({ page, total }) => `Page ${page} of ${total}`,
};

/**
 * Merge caller overrides over {@link defaultLabels}. Undefined entries in
 * the override are ignored, so partial `labels` objects are safe.
 *
 * @param overrides - A partial set of label overrides.
 * @returns A fully-populated, immutable label set.
 */
export function resolveLabels(
  overrides: TableLabels | undefined
): Required<TableLabels> {
  if (!overrides) return defaultLabels;
  const merged = { ...defaultLabels };
  for (const key of Object.keys(overrides) as (keyof TableLabels)[]) {
    const value = overrides[key];
    if (value !== undefined) {
      // Each key's value type matches the same key in the target.
      (merged[key] as unknown) = value;
    }
  }
  return merged;
}
