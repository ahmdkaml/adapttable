import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// Plain "bring your own Tailwind classes" look — deliberately distinct from the
// shadcn demo: an INDIGO accent, gray neutrals, softer radii. Same headless
// adapter, completely different visual character.
const TAILWIND: DataTableClassNames = {
  root: "rounded-lg border border-gray-200 bg-white text-gray-900 overflow-hidden shadow-sm",
  toolbar: "flex flex-wrap items-center gap-2 p-3 border-b border-gray-200",
  searchField:
    "flex h-9 items-center gap-2 rounded-md border border-gray-300 bg-white px-3 focus-within:border-indigo-400 focus-within:ring-2 focus-within:ring-indigo-100",
  searchIcon: "text-gray-400",
  search:
    "w-full bg-transparent text-sm outline-none placeholder:text-gray-400",
  sortSelect: "h-9 rounded-md border border-gray-300 px-2 text-sm",
  filtersButton:
    "inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50",
  filtersBackdrop: "fixed inset-0 z-40 bg-gray-900/30",
  filtersPanel:
    "fixed inset-y-0 end-0 z-50 flex w-[340px] max-w-[88vw] flex-col border-s border-gray-200 bg-white shadow-2xl",
  filtersPopover:
    "mt-2 w-80 max-w-[88vw] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl",
  filtersCount:
    "inline-grid h-5 min-w-5 place-items-center rounded-full bg-indigo-600 px-1 text-xs font-bold leading-none text-white",
  filtersHeader:
    "flex items-center justify-between border-b border-gray-200 px-4 py-3",
  filtersTitle: "text-base font-semibold text-gray-900",
  filtersClose:
    "flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none text-gray-500 hover:bg-gray-100",
  filtersBody: "flex-1 overflow-auto p-4",
  filtersFooter:
    "flex items-center justify-between gap-2 border-t border-gray-200 p-4",
  filtersClear:
    "h-9 rounded-md px-3 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  filtersDone:
    "h-9 rounded-md bg-indigo-600 px-4 text-sm font-medium text-white hover:bg-indigo-700",
  table: "w-full border-collapse text-sm",
  headerCell:
    "border-b border-gray-200 bg-gray-50/60 px-3 py-2.5 text-start font-semibold text-gray-500",
  sortButton:
    "inline-flex items-center gap-1 font-semibold text-gray-600 hover:text-indigo-600",
  row: "border-b border-gray-100 last:border-0 hover:bg-gray-50 data-[selected]:bg-indigo-50",
  cell: "px-3 py-2.5",
  actionButton:
    "h-8 w-8 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-800 disabled:opacity-50",
  footer:
    "flex items-center justify-between gap-2 border-t border-gray-200 p-3 text-sm text-gray-600",
  pageButton:
    "h-8 min-w-8 rounded-md border border-gray-300 px-2 hover:bg-gray-50 disabled:opacity-50",
  chips: "flex flex-wrap gap-2 px-3 pb-2",
  chip: "inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700",
  // ── Column popover ──────────────────────────────────────────────
  columnMenuButton:
    "inline-flex h-9 items-center gap-2 rounded-md border border-gray-300 px-3 text-sm font-medium text-gray-700 hover:bg-gray-50 data-[active]:border-indigo-400 data-[active]:bg-indigo-50",
  columnMenuPanel:
    "min-w-[264px] rounded-lg border border-gray-200 bg-white p-1.5 shadow-xl",
  columnMenuHeader: "px-1.5 pb-1.5 pt-1",
  columnMenuTitle:
    "text-[11px] font-semibold uppercase tracking-wider text-gray-400",
  columnMenuItem:
    "flex cursor-grab items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-gray-50",
  columnMenuGrip: "inline-flex cursor-grab text-gray-300 hover:text-gray-500",
  columnMenuLabel:
    "flex-1 truncate text-[13px] font-medium text-gray-700 data-[hidden]:text-gray-400 data-[hidden]:line-through",
  columnMenuVisibility:
    "inline-grid place-items-center rounded p-[3px] text-gray-400 hover:bg-gray-100 hover:text-gray-700",
  columnMenuPin:
    "inline-grid place-items-center rounded p-[3px] text-gray-400 hover:bg-gray-100 data-[active]:text-indigo-600",
  columnMenuReset:
    "mt-1.5 w-full border-t border-gray-100 px-2 pb-1 pt-2 text-start text-[13px] font-medium text-indigo-600 hover:text-indigo-700",
  resizeHandle: "hover:bg-indigo-300",
  card: "mb-2 rounded-lg border border-gray-200 p-3",
  cardRow: "flex justify-between gap-3 py-0.5 text-sm",
  cardLabel: "text-gray-500",
  cardValue: "font-medium",
};

export function UnstyledDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  return <UnstyledLike mode={mode} locale={locale} classNames={TAILWIND} />;
}
