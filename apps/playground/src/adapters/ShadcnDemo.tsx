import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// shadcn/ui is Tailwind utilities over headless primitives — exactly what the
// unstyled adapter exposes. These classes mirror shadcn's neutral card look
// (rounded-xl card, subtle borders, h-9 inputs, muted header text).
const SHADCN: DataTableClassNames = {
  root: "scn-root",
  toolbar: "scn-toolbar",
  search: "scn-search",
  sortSelect: "scn-select",
  filtersButton: "scn-filter-button",
  filtersBackdrop: "scn-filters-backdrop",
  filtersPanel: "scn-filter-panel",
  filtersHeader: "scn-filters-header",
  filtersTitle: "scn-filters-title",
  filtersClose: "scn-filters-close",
  filtersBody: "scn-filters-body",
  filtersFooter: "scn-filters-footer",
  filtersClear: "scn-filters-clear",
  filtersDone: "scn-filters-done",
  table: "scn-table",
  headerCell: "scn-header-cell",
  sortButton: "scn-sort-button",
  row: "scn-row",
  cell: "scn-cell",
  actionButton: "scn-action-button",
  footer: "scn-footer",
  pageButton: "scn-page-button",
  chips: "scn-chips",
  chip: "scn-chip",
  card: "scn-card",
  cardRow: "scn-card-row",
  cardLabel: "scn-card-label",
  cardValue: "scn-card-value",
};

export function ShadcnDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  return <UnstyledLike mode={mode} locale={locale} classNames={SHADCN} />;
}
