import type { DataTableClassNames } from "@adapttable/unstyled";

import { type Locale } from "../data";
import { type DataMode } from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// Plain Tailwind utilities — the generic "bring your own classes" look.
const TAILWIND: DataTableClassNames = {
  root: "ut-root",
  toolbar: "ut-toolbar",
  search: "ut-search",
  sortSelect: "ut-select",
  filtersButton: "ut-filter-button",
  filtersPanel: "ut-filter-panel",
  table: "ut-table",
  headerCell: "ut-header-cell",
  sortButton: "ut-sort-button",
  row: "ut-row",
  cell: "ut-cell",
  actionButton: "ut-action-button",
  footer: "ut-footer",
  pageButton: "ut-page-button",
  chips: "ut-chips",
  chip: "ut-chip",
  card: "ut-card",
  cardRow: "ut-card-row",
  cardLabel: "ut-card-label",
  cardValue: "ut-card-value",
};

export function UnstyledDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  return <UnstyledLike mode={mode} locale={locale} classNames={TAILWIND} />;
}
