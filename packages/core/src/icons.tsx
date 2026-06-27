import type { ReactElement } from "react";

/**
 * Shared chrome glyphs (currentColor, no icon-lib dependency) used by the
 * toolbar across adapters — a funnel for the Filters button and a magnifier
 * for the search field. Centralising them keeps every adapter's toolbar
 * identical and avoids cross-adapter duplication of the SVG markup.
 */

/** Three-line funnel glyph for the Filters button. */
export function FiltersIcon(): ReactElement {
  return (
    <svg
      width={16}
      height={16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

/** Magnifier glyph for the search field. */
export function SearchIcon(): ReactElement {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <circle cx={11} cy={11} r={7} />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
