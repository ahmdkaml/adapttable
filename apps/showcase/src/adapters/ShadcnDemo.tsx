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
  editing,
  cellNavigation,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  filtersUi?: FiltersUi;
  animate?: boolean;
  grouping?: boolean;
  editing?: boolean;
  cellNavigation?: boolean;
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
      editing={editing}
      cellNavigation={cellNavigation}
      classNames={shadcnClassNames}
    />
  );
}
