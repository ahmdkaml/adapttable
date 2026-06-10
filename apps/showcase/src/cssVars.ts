import type { CSSProperties } from "react";

/** Build an inline-style object that carries CSS custom properties (`--x`),
 * which React's `CSSProperties` type doesn't model directly. */
export const cssVars = (vars: Record<string, string | number>): CSSProperties =>
  vars;
