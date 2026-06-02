import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// shadcn/ui is Tailwind utilities over headless primitives — exactly what the
// unstyled adapter exposes. These classes mirror shadcn's neutral card look
// (rounded-xl card, subtle borders, h-9 inputs, muted header text).
const SHADCN: DataTableClassNames = {
  root: "rounded-xl border border-zinc-200 bg-white text-zinc-950 shadow-sm p-4",
  toolbar: "flex items-center gap-2 mb-3 flex-wrap",
  search:
    "h-9 rounded-md border border-zinc-300 bg-transparent px-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-400",
  sortSelect:
    "h-9 rounded-md border border-zinc-300 bg-transparent px-2 text-sm",
  filtersButton:
    "inline-flex h-9 items-center rounded-md border border-zinc-300 bg-transparent px-3 text-sm font-medium shadow-sm hover:bg-zinc-100",
  filtersPanel: "mt-3 rounded-lg border border-zinc-200 bg-white p-4 shadow-md",
  table: "w-full text-sm",
  headerCell: "h-10 text-start align-middle font-medium text-zinc-500 px-3",
  sortButton: "inline-flex items-center gap-1",
  row: "border-b border-zinc-100 transition-colors hover:bg-zinc-50 data-[selected]:bg-zinc-100",
  cell: "px-3 py-2 align-middle",
  actionButton:
    "inline-flex h-8 w-8 items-center justify-center rounded-md text-zinc-600 hover:bg-zinc-100 data-[color=red]:text-red-600",
  footer: "flex items-center gap-2 mt-3 text-sm flex-wrap text-zinc-600",
  pageButton:
    "inline-flex h-8 items-center rounded-md border border-zinc-300 bg-transparent px-2 text-sm hover:bg-zinc-100 disabled:opacity-40",
  chips: "flex items-center gap-2 flex-wrap mb-2",
  chip: "inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-0.5 text-xs",
};

export function ShadcnDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  return <UnstyledLike mode={mode} locale={locale} classNames={SHADCN} />;
}
