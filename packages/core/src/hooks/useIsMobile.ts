import { MOBILE_BREAKPOINT_PX } from "../constants";
import type { PaginationMode, ResolvedPaginationMode } from "../types";
import { useMediaQuery } from "./useMediaQuery";

/** The media query that matches the mobile layout. */
export const MOBILE_MEDIA_QUERY = `(max-width: ${MOBILE_BREAKPOINT_PX}px)`;

/**
 * Whether the viewport is at or below the mobile breakpoint.
 *
 * @returns `true` on mobile-width viewports.
 */
export function useIsMobile(): boolean {
  return useMediaQuery(MOBILE_MEDIA_QUERY);
}

/**
 * Resolve `"auto"` to a concrete pagination mode (mobile → infinite,
 * desktop → paged). A non-auto mode is returned unchanged.
 *
 * @param mode - The requested pagination mode.
 * @param isMobile - Whether the table is in its mobile layout.
 * @returns The resolved mode.
 */
export function resolvePaginationMode(
  mode: PaginationMode,
  isMobile: boolean
): ResolvedPaginationMode {
  if (mode !== "auto") return mode;
  return isMobile ? "infinite" : "paged";
}
