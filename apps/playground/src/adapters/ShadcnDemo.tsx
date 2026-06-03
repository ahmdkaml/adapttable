import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// shadcn/ui is Tailwind utilities over headless primitives — exactly what the
// unstyled adapter exposes. Real shadcn design tokens (bg-card,
// text-muted-foreground, border-border, bg-primary…) defined in tailwind.css.
const SHADCN: DataTableClassNames = {
  root: "rounded-xl border border-border bg-card text-card-foreground overflow-hidden",
  toolbar: "flex flex-wrap items-center gap-2 p-3 border-b border-border",
  search:
    "h-9 w-56 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring",
  sortSelect: "h-9 rounded-md border border-input bg-background px-2 text-sm",
  filtersButton:
    "h-9 rounded-md border border-input px-3 text-sm hover:bg-accent",
  filtersBackdrop: "fixed inset-0 bg-black/40",
  filtersPanel:
    "fixed inset-y-0 end-0 z-50 flex w-80 flex-col gap-3 border-s border-border bg-card p-4 text-card-foreground shadow-xl",
  filtersHeader: "flex items-center justify-between",
  filtersTitle: "text-sm font-semibold",
  filtersClose: "h-8 w-8 rounded-md hover:bg-accent",
  filtersBody: "flex-1 overflow-auto",
  filtersFooter:
    "flex items-center justify-between gap-2 border-t border-border pt-2",
  filtersClear:
    "h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50",
  filtersDone: "h-9 rounded-md bg-primary px-3 text-sm text-primary-foreground",
  table: "w-full border-collapse text-sm",
  headerCell:
    "border-b border-border bg-card px-3 py-2 text-start font-medium text-muted-foreground",
  sortButton: "inline-flex items-center gap-1 font-medium",
  row: "border-b border-border hover:bg-muted/50 data-[selected]:bg-accent",
  cell: "px-3 py-2",
  actionButton:
    "h-8 rounded-md px-2 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50",
  footer:
    "flex items-center justify-between gap-2 border-t border-border p-3 text-sm",
  pageButton:
    "h-8 min-w-8 rounded-md border border-input px-2 hover:bg-accent disabled:opacity-50",
  chips: "flex flex-wrap gap-2 px-3 pb-2",
  chip: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground",
  columnMenuButton:
    "h-9 rounded-md border border-input px-3 text-sm hover:bg-accent",
  columnMenuPanel:
    "mt-1 min-w-56 rounded-md border border-border bg-card p-2 shadow-md",
  columnMenuItem: "flex items-center justify-between gap-2 px-1 py-1 text-sm",
  resizeHandle: "hover:bg-border",
  card: "mb-2 rounded-lg border border-border p-3",
  cardRow: "flex justify-between gap-3 py-0.5 text-sm",
  cardLabel: "text-muted-foreground",
  cardValue: "font-medium",
};

export function ShadcnDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  return <UnstyledLike mode={mode} locale={locale} classNames={SHADCN} />;
}
