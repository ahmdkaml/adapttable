import type { SortDirection } from "../types";

/** A column's sort state. */
export interface SortState {
  key: string | undefined;
  dir: SortDirection | undefined;
}

/**
 * Advance the three-step sort cycle for a column header click:
 * inactive → ascending → descending → cleared.
 *
 * @param current - The current sort state.
 * @param key - The column key that was clicked.
 * @returns The next sort state.
 */
export function nextSort(current: SortState, key: string): SortState {
  if (current.key !== key) return { key, dir: "asc" };
  if (current.dir === "asc") return { key, dir: "desc" };
  return { key: undefined, dir: undefined };
}
