import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// shadcn/ui = Tailwind utilities over headless primitives — exactly what the
// unstyled adapter exposes. Real shadcn design tokens (bg-card,
// text-muted-foreground, border-border, bg-primary…) are defined in
// tailwind.css. The look is deliberately MONOCHROME with ring focus — the
// shadcn signature — to contrast with the indigo "plain Tailwind" demo.
const SHADCN: DataTableClassNames = {
  root: "rounded-xl border border-border bg-card text-card-foreground overflow-hidden shadow-sm",
  toolbar: "flex flex-wrap items-center gap-2 p-3 border-b border-border",
  search:
    "h-9 w-56 rounded-md border border-input bg-background px-3 text-sm outline-none placeholder:text-muted-foreground focus:ring-2 focus:ring-ring focus:ring-offset-1 focus:ring-offset-background",
  sortSelect: "h-9 rounded-md border border-input bg-background px-2 text-sm",
  filtersButton:
    "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
  filtersBackdrop: "fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]",
  filtersPanel:
    "fixed inset-y-0 end-0 z-50 flex w-[340px] max-w-[88vw] flex-col border-s border-border bg-card text-card-foreground shadow-2xl",
  filtersHeader:
    "flex items-center justify-between border-b border-border px-4 py-3",
  filtersTitle: "text-base font-semibold",
  filtersClose:
    "flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none text-muted-foreground hover:bg-accent",
  filtersBody: "flex-1 overflow-auto p-4",
  filtersFooter:
    "flex items-center justify-between gap-2 border-t border-border p-4",
  filtersClear:
    "h-9 rounded-md px-3 text-sm text-muted-foreground hover:bg-accent disabled:opacity-50",
  filtersDone:
    "h-9 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90",
  table: "w-full border-collapse text-sm",
  headerCell:
    "border-b border-border bg-card px-3 py-2.5 text-start font-medium text-muted-foreground",
  sortButton:
    "inline-flex items-center gap-1 font-medium hover:text-foreground",
  row: "border-b border-border last:border-0 hover:bg-muted/50 data-[selected]:bg-accent",
  cell: "px-3 py-2.5",
  actionButton:
    "h-8 w-8 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50",
  footer:
    "flex items-center justify-between gap-2 border-t border-border p-3 text-sm text-muted-foreground",
  pageButton:
    "h-8 min-w-8 rounded-md border border-input bg-background px-2 hover:bg-accent disabled:opacity-50",
  chips: "flex flex-wrap gap-2 px-3 pb-2",
  chip: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground",
  // ── Column popover ──────────────────────────────────────────────
  columnMenuButton:
    "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent data-[active]:bg-accent",
  columnMenuPanel:
    "min-w-[264px] rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-xl",
  columnMenuHeader: "flex items-center justify-between px-2 pb-1.5 pt-1",
  columnMenuTitle:
    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
  columnMenuItem:
    "flex items-center gap-1.5 rounded-md px-1 py-1 hover:bg-muted/60 data-[hidden]:opacity-60",
  columnMenuGrip:
    "flex h-7 w-5 cursor-grab items-center justify-center rounded text-muted-foreground/60 hover:text-foreground active:cursor-grabbing",
  columnMenuLabel: "flex-1 truncate text-sm",
  columnMenuVisibility:
    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground data-[active]:text-foreground",
  columnMenuPin:
    "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground data-[active]:bg-primary data-[active]:text-primary-foreground",
  columnMenuReset:
    "mt-1 w-full rounded-md px-2 py-1.5 text-start text-sm font-medium text-foreground hover:bg-muted/60",
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
