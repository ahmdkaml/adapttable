import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// Real Tailwind utilities — the generic "bring your own classes" look.
const TAILWIND: DataTableClassNames = {
  root: "rounded-lg border border-gray-200 bg-white text-gray-900 overflow-hidden",
  toolbar: "flex flex-wrap items-center gap-2 p-3 border-b border-gray-200",
  search:
    "h-9 w-56 rounded-md border border-gray-300 px-3 text-sm outline-none focus:border-gray-400",
  sortSelect: "h-9 rounded-md border border-gray-300 px-2 text-sm",
  filtersButton:
    "h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50",
  filtersBackdrop: "fixed inset-0 bg-black/30",
  filtersPanel:
    "fixed inset-y-0 end-0 z-50 flex w-80 flex-col gap-3 bg-white p-4 shadow-xl",
  filtersHeader: "flex items-center justify-between",
  filtersTitle: "text-sm font-semibold",
  filtersClose: "h-8 w-8 rounded-md hover:bg-gray-100",
  filtersBody: "flex-1 overflow-auto",
  filtersFooter:
    "flex items-center justify-between gap-2 border-t border-gray-200 pt-2",
  filtersClear:
    "h-9 rounded-md px-3 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  filtersDone: "h-9 rounded-md bg-gray-900 px-3 text-sm text-white",
  table: "w-full border-collapse text-sm",
  headerCell:
    "border-b border-gray-200 bg-white px-3 py-2 text-start font-semibold text-gray-500",
  sortButton: "inline-flex items-center gap-1 font-semibold text-gray-600",
  row: "border-b border-gray-100 hover:bg-gray-50 data-[selected]:bg-blue-50",
  cell: "px-3 py-2",
  actionButton:
    "h-8 rounded-md px-2 text-sm text-gray-600 hover:bg-gray-100 disabled:opacity-50",
  footer:
    "flex items-center justify-between gap-2 border-t border-gray-200 p-3 text-sm",
  pageButton:
    "h-8 min-w-8 rounded-md border border-gray-300 px-2 hover:bg-gray-50 disabled:opacity-50",
  chips: "flex flex-wrap gap-2 px-3 pb-2",
  chip: "inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-1 text-xs",
  columnMenuButton:
    "h-9 rounded-md border border-gray-300 px-3 text-sm hover:bg-gray-50",
  columnMenuPanel:
    "mt-1 min-w-56 rounded-md border border-gray-200 bg-white p-2 shadow-lg",
  columnMenuItem: "flex items-center justify-between gap-2 px-1 py-1 text-sm",
  resizeHandle: "hover:bg-gray-300",
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
