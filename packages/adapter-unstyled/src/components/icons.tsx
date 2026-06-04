import type { ReactNode } from "react";

interface IconProps {
  size?: number;
  className?: string;
}

function Svg({
  size = 16,
  className,
  children,
}: Readonly<IconProps & { children: ReactNode }>) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

/** Magnifying-glass search glyph (inline SVG, `currentColor`). */
export const SearchIcon = (p: Readonly<IconProps>) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
);

/** Funnel glyph for the Filters button (inline SVG, `currentColor`). */
export const FiltersIcon = (p: Readonly<IconProps>) => (
  <Svg {...p}>
    <path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z" />
  </Svg>
);
