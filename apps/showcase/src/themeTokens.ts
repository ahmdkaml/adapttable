/** Per-adapter accent + blurb (from the design tokens) — drives the live-demo
 * switcher cards and the hero chips. The real adapter components do the actual
 * styling; these are just for the marketing chrome. */
export interface AdapterToken {
  key: string;
  label: string;
  blurb: string;
  accentLight: string;
  accentDark: string;
}

export const ADAPTER_TOKENS: AdapterToken[] = [
  {
    key: "mantine",
    label: "Mantine",
    blurb: "Rounded, friendly, filled controls",
    accentLight: "oklch(0.58 0.17 252)",
    accentDark: "oklch(0.66 0.16 252)",
  },
  {
    key: "mui",
    label: "MUI",
    blurb: "Material elevation, uppercase actions",
    accentLight: "oklch(0.55 0.18 264)",
    accentDark: "oklch(0.7 0.15 264)",
  },
  {
    key: "chakra",
    label: "Chakra",
    blurb: "Soft teal, generous radius",
    accentLight: "oklch(0.6 0.1 188)",
    accentDark: "oklch(0.72 0.1 188)",
  },
  {
    key: "antd",
    label: "Ant Design",
    blurb: "Compact, tinted header, crisp",
    accentLight: "oklch(0.56 0.2 262)",
    accentDark: "oklch(0.65 0.18 262)",
  },
  {
    key: "shadcn",
    label: "shadcn / Tailwind",
    blurb: "Unstyled — monochrome, ring focus",
    accentLight: "oklch(0.28 0.01 264)",
    accentDark: "oklch(0.92 0.004 264)",
  },
];
