/**
 * Package-local defaults. Adapters may override per-table via props; these
 * are the headless fallbacks.
 */

/** Viewport width (px) below which `"auto"` pagination flips to infinite. */
export const MOBILE_BREAKPOINT_PX = 768;

/** Default rows-per-page. */
export const DEFAULT_LIMIT = 25;

/** Page-size options offered by adapter pagination controls. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/**
 * Page-size options to render in a rows-per-page selector, guaranteeing the
 * currently-active `limit` is present. A `limit` that isn't one of the
 * standard {@link PAGE_SIZE_OPTIONS} (e.g. restored from a shared URL) is
 * prepended so the control shows a valid selection instead of going blank.
 *
 * @param limit - The currently-active page size.
 * @param sizes - The standard options to offer (defaults to {@link PAGE_SIZE_OPTIONS}).
 * @returns The options to render, with `limit` guaranteed present.
 */
export function pageSizeOptions(
  limit: number,
  sizes: readonly number[] = PAGE_SIZE_OPTIONS
): readonly number[] {
  return sizes.includes(limit) ? sizes : [limit, ...sizes];
}

/** Default debounce (ms) for the search input before it commits to state. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Default row-height estimate (px) for virtualized desktop tables. */
export const DEFAULT_ROW_SIZE_PX = 56;

/** Default card-height estimate (px) for virtualized mobile layouts. */
export const DEFAULT_CARD_SIZE_PX = 132;

/** Default extra rows/cards rendered above and below the virtual window. */
export const VIRTUAL_OVERSCAN = 8;
