import type { ReactElement } from "react";

/** Minimal functional icon set for the marketing chrome (currentColor). */
function make(paths: string[]) {
  return function Icon({
    size = 16,
  }: Readonly<{ size?: number }>): ReactElement {
    return (
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {paths.map((d) => (
          <path key={d} d={d} />
        ))}
      </svg>
    );
  };
}

export const Bolt = make(["M13 2L4 14h7l-1 8 9-12h-7l1-8z"]);
export const Check = make(["M5 12l5 5L20 7"]);
export const Sun = make([
  "M12 4V2",
  "M12 22v-2",
  "M4 12H2",
  "M22 12h-2",
  "M6 6L4.5 4.5",
  "M19.5 19.5L18 18",
  "M18 6l1.5-1.5",
  "M4.5 19.5L6 18",
  "M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
]);
export const Moon = make(["M20 14.5A8 8 0 1 1 9.5 4 6.5 6.5 0 0 0 20 14.5z"]);
export const External = make([
  "M14 4h6v6",
  "M20 4l-9 9",
  "M19 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5",
]);
export const Star = make([
  "M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 9.5l6.1-.9L12 3z",
]);
export const Pin = make(["M9 4h6l-1 6 3 3v2H7v-2l3-3-1-6z", "M12 15v5"]);
export const Resize = make(["M9 3H5v4", "M15 21h4v-4", "M5 7l14 10"]);
export const Columns = make(["M4 5h16v14H4z", "M12 5v14", "M16 5v14"]);
/** Arrow-key cell navigation: a cell with the four arrows around it. */
export const Keyboard = make([
  "M9 9h6v6H9z",
  "M12 3v3",
  "M12 18v3",
  "M3 12h3",
  "M18 12h3",
]);
export const Layers = make(["M12 3l9 5-9 5-9-5 9-5z", "M3 13l9 5 9-5"]);
export const Phone = make(["M7 2h10v20H7z", "M10.5 19h3"]);
export const Monitor = make(["M3 4h18v12H3z", "M8 20h8", "M12 16v4"]);
export const Database = make([
  "M12 3c4.4 0 8 1.3 8 3s-3.6 3-8 3-8-1.3-8-3 3.6-3 8-3z",
  "M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6",
  "M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
]);
export const Server = make([
  "M4 5h16v6H4z",
  "M4 13h16v6H4z",
  "M8 8h.01",
  "M8 16h.01",
]);
export const Globe = make([
  "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z",
  "M3 12h18",
  "M12 3c2.5 2.4 4 5.6 4 9s-1.5 6.6-4 9c-2.5-2.4-4-5.6-4-9s1.5-6.6 4-9z",
]);
