import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// Plain Tailwind utilities — the generic "bring your own classes" look.
const TAILWIND: DataTableClassNames = {
  root: "rounded-lg border border-zinc-200 p-3",
  toolbar: "flex items-center gap-2 mb-2 flex-wrap",
  search: "rounded border border-zinc-300 px-2 py-1 text-sm",
  sortSelect: "rounded border border-zinc-300 px-2 py-1 text-sm",
  filtersButton: "rounded border border-zinc-300 px-3 py-1 text-sm hover:bg-zinc-50", // prettier-ignore
  filtersPanel: "mt-2 rounded-lg border border-zinc-200 bg-white p-3",
  table: "w-full text-sm",
  headerCell: "text-start font-medium text-zinc-500 px-3 py-2",
  sortButton: "inline-flex items-center gap-1",
  row: "border-t border-zinc-100 hover:bg-zinc-50 data-[selected]:bg-blue-50",
  cell: "px-3 py-2",
  actionButton: "inline-flex items-center rounded p-1 text-zinc-600 hover:bg-zinc-100 data-[color=red]:text-red-600", // prettier-ignore
  footer: "flex items-center gap-2 mt-2 text-sm flex-wrap",
  pageButton: "rounded border border-zinc-300 px-2 py-1 disabled:opacity-40",
  chips: "flex items-center gap-2 flex-wrap mb-2",
  chip: "inline-flex items-center gap-1 rounded-full bg-zinc-100 px-2 py-0.5 text-xs", // prettier-ignore
};

export function UnstyledDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  return <UnstyledLike mode={mode} locale={locale} classNames={TAILWIND} />;
}
