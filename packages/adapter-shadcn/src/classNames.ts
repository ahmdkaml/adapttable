import type { DataTableClassNames } from "@adapttable/unstyled";

/**
 * shadcn/ui class preset for AdaptTable. Maps every AdaptTable part to shadcn's
 * design-token utility classes (`bg-card`, `text-muted-foreground`,
 * `border-border`, `bg-primary`, `ring-ring`, …) — deliberately **monochrome
 * with ring focus**, the shadcn signature.
 *
 * It only *references* shadcn's tokens, so your app must have shadcn/ui set up
 * (its CSS variables + Tailwind config). Pass this to a `@adapttable/unstyled`
 * `<DataTable classNames={shadcnClassNames} />`, or just import the pre-wired
 * `DataTable` from `@adapttable/shadcn`. Override any part by merging your own
 * classes over it.
 */
export const shadcnClassNames: DataTableClassNames = {
  root: "rounded-xl border border-border bg-card text-card-foreground shadow-sm",
  toolbar: "flex flex-wrap items-center gap-2 p-3 border-b border-border",
  searchField:
    "flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1 focus-within:ring-offset-background",
  searchIcon: "text-muted-foreground",
  search:
    "w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground",
  sortSelect: "h-9 rounded-md border border-input bg-background px-2 text-sm",
  rowsPerPageSelect:
    "h-8 rounded-md border border-input bg-background px-1.5 text-sm text-foreground",
  filtersButton:
    "shrink-0 whitespace-nowrap inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent hover:text-accent-foreground",
  filtersBackdrop: "fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]",
  filtersPanel:
    "fixed inset-y-0 end-0 z-50 flex w-[340px] max-w-[88vw] flex-col border-s border-border bg-card text-card-foreground shadow-2xl",
  filtersPopover:
    "z-50 mt-2 w-80 max-w-[88vw] overflow-hidden rounded-lg border border-border bg-card text-card-foreground shadow-xl",
  filtersCount:
    "inline-grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-xs font-bold leading-none text-primary-foreground",
  filtersHeader:
    "flex items-center justify-between border-b border-border px-4 py-3",
  filtersTitle: "text-base font-semibold",
  filtersClose:
    "flex h-8 w-8 items-center justify-center rounded-md text-lg leading-none text-muted-foreground hover:bg-accent",
  filtersBody: "flex flex-1 flex-col gap-4 overflow-auto p-4",
  // ── Auto-built filter form (declarative `filters` definitions) ──
  filterField: "m-0 flex min-w-0 flex-col gap-1.5 border-0 p-0",
  filterLabel: "p-0 text-xs font-medium text-muted-foreground",
  filterInput:
    "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring",
  filterSelect:
    "h-9 w-full rounded-md border border-input bg-background px-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring",
  filterCheckboxGroup: "flex flex-wrap gap-1.5",
  filterCheckbox:
    "inline-flex cursor-pointer select-none items-center rounded-full border border-input bg-background px-3 py-1 text-[13px] font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground [&>input]:sr-only",
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
    "inline-grid h-8 min-w-8 place-items-center rounded-md border border-input bg-background px-2 text-foreground hover:bg-accent disabled:opacity-40",
  chips: "flex flex-wrap gap-2 px-3 pb-2",
  chip: "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground",
  chipRemove:
    "rounded px-1 text-muted-foreground transition-colors hover:text-foreground",
  empty:
    "flex flex-wrap items-center justify-center gap-3 px-4 py-10 text-sm text-muted-foreground",
  emptyClear:
    "rounded-md border border-input px-2.5 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted",
  // ── Column popover ──────────────────────────────────────────────
  columnMenuButton:
    "shrink-0 whitespace-nowrap inline-flex h-9 items-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent data-[active]:bg-accent",
  columnMenuPanel:
    "z-50 min-w-[264px] rounded-xl border border-border bg-card p-1.5 text-card-foreground shadow-xl",
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
