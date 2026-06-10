import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode, type Density, type PageMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// shadcn/ui = Tailwind utilities over headless primitives — exactly what the
// unstyled adapter exposes. Real shadcn design tokens (bg-card,
// text-muted-foreground, border-border, bg-primary…) are defined in
// tailwind.css. The look is deliberately MONOCHROME with ring focus — the
// shadcn signature — to contrast with the indigo "plain Tailwind" demo.
const SHADCN: DataTableClassNames = {
  root: "rounded-xl border border-border bg-card text-card-foreground overflow-hidden shadow-sm",
  toolbar: "flex flex-wrap items-center gap-2 p-3 border-b border-border",
  searchField:
    "flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background",
  searchIcon: "text-muted-foreground",
  search:
    "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground",
  sortSelect: "h-9 rounded-md border border-input bg-background px-2 text-sm",
  filtersButton:
    "inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
  filtersBackdrop: "fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]",
  filtersPanel:
    "fixed inset-y-0 end-0 z-50 flex w-[340px] max-w-[88vw] flex-col border-s border-border bg-card text-card-foreground shadow-2xl",
  filtersPopover:
    "mt-2 w-80 max-w-[88vw] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl",
  filtersCount:
    "inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold leading-none text-primary-foreground",
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
  // Pinned cells must be opaque so scrolled content never shows through.
  cell: "px-3 py-2.5 [&[data-pinned]]:bg-card",
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
  columnMenuHeader: "px-1.5 pb-1.5 pt-1",
  columnMenuTitle:
    "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground",
  columnMenuItem:
    "flex cursor-grab items-center gap-2 rounded-md px-1.5 py-1.5 hover:bg-muted/60",
  columnMenuGrip:
    "inline-flex cursor-grab text-muted-foreground/50 hover:text-foreground",
  columnMenuLabel:
    "flex-1 truncate text-[13px] font-medium data-[hidden]:text-muted-foreground data-[hidden]:line-through",
  columnMenuVisibility:
    "inline-grid place-items-center rounded p-[3px] text-muted-foreground hover:bg-muted hover:text-foreground",
  columnMenuPin:
    "inline-grid place-items-center rounded p-[3px] text-muted-foreground hover:bg-muted data-[active]:text-primary",
  columnMenuReset:
    "mt-1.5 w-full border-t border-border px-2 pb-1 pt-2 text-start text-[13px] font-medium text-primary hover:opacity-80",
  resizeHandle: "hover:bg-border",
  card: "mb-2 rounded-lg border border-border p-3",
  cardRow: "flex justify-between gap-3 py-0.5 text-sm",
  cardLabel: "text-muted-foreground",
  cardValue: "font-medium",
};

export function ShadcnDemo({
  mode,
  locale,
  pageMode,
  urlKey,
  density,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
}>) {
  return (
    <UnstyledLike
      mode={mode}
      locale={locale}
      pageMode={pageMode}
      urlKey={urlKey}
      density={density}
      classNames={SHADCN}
    />
  );
}
