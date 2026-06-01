/** Derived pagination figures for a paged view. */
export interface PaginationInfo {
  /** Total number of pages (always ≥ 1). */
  totalPages: number;
  /** The page clamped into `[1, totalPages]`. */
  safePage: number;
  /** 1-based index of the first row on the page (0 when empty). */
  fromIndex: number;
  /** 1-based index of the last row on the page (0 when empty). */
  toIndex: number;
}

/**
 * Compute page count and the visible "from–to" range for a paged view.
 *
 * @param input - Current `page`, `limit`, and `total`.
 * @returns The derived {@link PaginationInfo}.
 */
export function computePagination(input: {
  page: number;
  limit: number;
  total: number;
}): PaginationInfo {
  const limit = Math.max(input.limit, 1);
  const total = Math.max(input.total, 0);
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(Math.max(input.page, 1), totalPages);
  const fromIndex = total === 0 ? 0 : (safePage - 1) * limit + 1;
  const toIndex = Math.min(safePage * limit, total);
  return { totalPages, safePage, fromIndex, toIndex };
}
