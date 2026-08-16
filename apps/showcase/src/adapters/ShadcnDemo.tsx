import type { ColumnLayoutState } from "@adapttable/core";
import { shadcnClassNames } from "@adapttable/shadcn";
import type { DataTableProps } from "@adapttable/unstyled";

import { type Locale, type Person } from "../data";
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
  highlight,
  realtime,
  editing,
  cellNavigation,
  headerFilters,
  columnGroups,
  sparkline,
  editorShowcase,
  exportCsv,
  columnMenu,
  filterControls,
  bulkActions,
  statusBar,
  contextMenu,
  densityChooser,
  onDensityChange,
  fullscreen,
  commandPalette,
  onPrint,
  undoRedoButtons,
  sidePanel,
  wide,
  defaultColumnLayout,
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
  highlight?: boolean;
  realtime?: boolean;
  editing?: boolean;
  cellNavigation?: boolean;
  headerFilters?: boolean;
  columnGroups?: boolean;
  sparkline?: boolean;
  editorShowcase?: boolean;
  /** The toolbar Export button's configuration. */
  exportCsv?: DataTableProps<Person>["exportCsv"];
  columnMenu?: boolean;
  filterControls?: boolean;
  bulkActions?: boolean;
  statusBar?: boolean;
  contextMenu?: boolean;
  densityChooser?: boolean;
  onDensityChange?: (next: "comfortable" | "compact") => void;
  fullscreen?: boolean;
  commandPalette?: boolean;
  onPrint?: () => void;
  undoRedoButtons?: boolean;
  sidePanel?: DataTableProps<Person>["sidePanel"];
  wide?: boolean;
  defaultColumnLayout?: Partial<ColumnLayoutState>;
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
      highlight={highlight}
      realtime={realtime}
      editing={editing}
      cellNavigation={cellNavigation ?? editing}
      statusBar={statusBar}
      contextMenu={contextMenu}
      densityChooser={densityChooser}
      onDensityChange={onDensityChange}
      fullscreen={fullscreen}
      commandPalette={commandPalette}
      onPrint={onPrint}
      undoRedoButtons={undoRedoButtons}
      sidePanel={sidePanel}
      headerFilters={headerFilters}
      columnGroups={columnGroups}
      sparkline={sparkline}
      editorShowcase={editorShowcase}
      exportCsv={exportCsv}
      columnMenu={columnMenu}
      filterControls={filterControls}
      bulkActions={bulkActions}
      wide={wide}
      defaultColumnLayout={defaultColumnLayout}
      forceMobile={forceMobile}
      focused={focused}
      classNames={shadcnClassNames}
    />
  );
}
