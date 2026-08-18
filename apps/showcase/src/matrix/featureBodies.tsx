/**
 * Which demo a feature page mounts under its seam.
 *
 * Every body is lazy, and that is not an optimisation detail: all thirteen
 * matrix pages boot the same entry module, so a static import here would ship
 * the pivot engine, the PDF writer and the formula parser to a reader who
 * opened the columns page. One `import()` per feature means each page carries
 * its own demo and nothing else.
 */
import { type ComponentType, lazy } from "react";

/**
 * What a feature body is handed: the theme, and the kit it must render in.
 *
 * The adapter is fixed by the URL rather than chosen on the page — that is the
 * whole point of an adapter-first demo — so no body owns kit state or draws a
 * switcher.
 */
export interface FeatureBodyProps {
  readonly dark: boolean;
  readonly adapter: string;
}

const load = <TModule extends Record<string, unknown>>(
  importer: () => Promise<TModule>,
  name: keyof TModule
): ComponentType<FeatureBodyProps> =>
  lazy(() =>
    importer().then((module) => ({
      default: module[name] as ComponentType<FeatureBodyProps>,
    }))
  );

/** Feature slug to the demo that page shows. */
export const FEATURE_BODIES: Record<string, ComponentType<FeatureBodyProps>> = {
  columns: load(() => import("../ColumnsDemo"), "ColumnsDemo"),
  editing: load(() => import("../EditingDemo"), "EditingDemo"),
  export: load(() => import("../ExportPdfDemo"), "ExportPdfDemo"),
  filtering: load(() => import("../FilteringDemo"), "FilteringDemo"),
  formulas: load(() => import("../FormulasDemo"), "FormulasDemo"),
  grouping: load(() => import("../GroupingDemo"), "GroupingDemo"),
  "mobile-cards": load(() => import("../MobileDemo"), "MobileDemo"),
  pivot: load(() => import("../PivotDemo"), "PivotDemo"),
  "saved-views": load(() => import("../SavedViewsDemo"), "SavedViewsDemo"),
  scale: load(() => import("../ScaleDemo"), "ScaleDemo"),
  selection: load(() => import("../SelectionDemo"), "SelectionDemo"),
  tree: load(() => import("../TreeDemo"), "TreeDemo"),
};

/**
 * The table an adapter's landing page shows: the kit's own demo, with the
 * features a first look should carry and nothing that needs explaining.
 */
export const LandingTable = lazy(() =>
  import("./LandingTable").then((module) => ({
    default: module.LandingTable,
  }))
);
