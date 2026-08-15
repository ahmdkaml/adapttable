import { shadcnClassNames } from "@adapttable/shadcn";

import { type Locale } from "../data";
import {
  type DataMode,
  type Density,
  type FiltersUi,
  type PageMode,
} from "../Demo";
import { UnstyledLike } from "./UnstyledLike";

// shadcn/ui = Tailwind utilities over headless primitives — exactly what the
// unstyled adapter exposes. The class map now lives in `@adapttable/shadcn`
// (single source of truth); this demo mounts the unstyled adapter with that
// preset, the same one-import preset a consumer gets. Real shadcn tokens
// (bg-card, text-muted-foreground, border-border, bg-primary…) come from
// tailwind.css.
export function ShadcnDemo({
  mode,
  locale,
  pageMode,
  urlKey,
  density,
  filtersUi,
  animate,
  grouping,
  tree,
  nested,
  rowMode,
  batch,
  rowMutations,
  rowReorder,
  rowPinning,
  cellSpan,
  extraRows,
  rowStyle,
  editing,
  cellNavigation,
  headerFilters,
  columnGroups,
  sparkline,
  columnMenu,
  filterControls,
  wide,
  forceMobile,
  focused,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  filtersUi?: FiltersUi;
  animate?: boolean;
  grouping?: boolean;
  tree?: boolean;
  nested?: boolean;
  rowMode?: boolean;
  batch?: boolean;
  rowMutations?: boolean;
  rowReorder?: boolean;
  rowPinning?: boolean;
  cellSpan?: boolean;
  extraRows?: boolean;
  rowStyle?: boolean;
  editing?: boolean;
  cellNavigation?: boolean;
  headerFilters?: boolean;
  columnGroups?: boolean;
  sparkline?: boolean;
  columnMenu?: boolean;
  filterControls?: boolean;
  wide?: boolean;
  forceMobile?: boolean;
  focused?: boolean;
}>) {
  return (
    <UnstyledLike
      mode={mode}
      locale={locale}
      pageMode={pageMode}
      urlKey={urlKey}
      density={density}
      filtersUi={filtersUi}
      animate={animate}
      grouping={grouping}
      tree={tree}
      nested={nested}
      rowMode={rowMode}
      batch={batch}
      rowMutations={rowMutations}
      rowReorder={rowReorder}
      rowPinning={rowPinning}
      cellSpan={cellSpan}
      extraRows={extraRows}
      rowStyle={rowStyle}
      editing={editing}
      cellNavigation={cellNavigation ?? editing}
      headerFilters={headerFilters}
      columnGroups={columnGroups}
      sparkline={sparkline}
      columnMenu={columnMenu}
      filterControls={filterControls}
      wide={wide}
      forceMobile={forceMobile}
      focused={focused}
      classNames={shadcnClassNames}
    />
  );
}
