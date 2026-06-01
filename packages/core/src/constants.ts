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

/** Default debounce (ms) for the search input before it commits to state. */
export const SEARCH_DEBOUNCE_MS = 300;

/** Default per-row height estimate (px) for desktop virtualization. */
export const DEFAULT_ROW_SIZE_PX = 52;

/** Default per-card height estimate (px) for mobile virtualization. */
export const DEFAULT_CARD_SIZE_PX = 132;

/** Extra rows rendered above/below the viewport when virtualizing. */
export const VIRTUAL_OVERSCAN = 8;
