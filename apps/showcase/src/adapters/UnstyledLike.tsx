import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable, type DataTableClassNames } from "@adapttable/unstyled";
import type { CSSProperties } from "react";

import {
  type AvatarCellProps,
  type DemoCells,
  demoConfirm,
  demoFilterDefs,
  demoSavedViews,
  initials,
  LIVE_DEFAULT_LAYOUT,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  nameHue,
  type StatusCellProps,
  statusTone,
  strings,
} from "../data";
import {
  type DataMode,
  DemoBody,
  type Density,
  type FiltersUi,
  type PageMode,
} from "../Demo";

/** Inline style carrying the avatar's hue as a CSS custom property, so the
 * Tailwind arbitrary values can theme it per light/dark. */
type AvatarStyle = CSSProperties & { "--avatar-h": string };

const avatarStyle = (name: string): AvatarStyle => ({
  "--avatar-h": String(nameHue(name)),
});

const TAILWIND_STATUS = {
  green:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  red: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
  gray: "bg-zinc-100 text-zinc-600 dark:bg-zinc-700/50 dark:text-zinc-300",
} as const;

/** Class-driven cell visuals (no UI kit) — Tailwind utilities for shadcn/plain. */
const TAILWIND_CELLS: DemoCells = {
  Avatar: ({ name }: AvatarCellProps) => (
    <span
      className="inline-grid h-9 w-9 place-items-center rounded-full text-xs font-bold [background:hsl(var(--avatar-h)_60%_88%)] [color:hsl(var(--avatar-h)_45%_30%)] dark:[background:hsl(var(--avatar-h)_45%_24%)] dark:[color:hsl(var(--avatar-h)_70%_78%)]"
      style={avatarStyle(name)}
    >
      {initials(name)}
    </span>
  ),
  Status: ({ status, label }: StatusCellProps) => (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${TAILWIND_STATUS[statusTone(status)]}`}
    >
      {label}
    </span>
  ),
  Load: ({ value, meta }: LoadCellProps) => (
    <div className="min-w-[90px]">
      <div className="h-1.5 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
        <div
          className="h-full rounded-full bg-blue-500"
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
        {meta}
      </div>
    </div>
  ),
};

/**
 * The unstyled adapter ships no CSS, so "compact" density can't change padding
 * on its own — we tighten the cell/header vertical padding token here so the
 * change is visible.
 */
function withDensity(
  classNames: DataTableClassNames,
  density: Density
): DataTableClassNames {
  if (density !== "compact") return classNames;
  const tighten = (cls?: string) => cls?.replace("py-2.5", "py-1.5");
  return {
    ...classNames,
    cell: tighten(classNames.cell),
    headerCell: tighten(classNames.headerCell),
  };
}

/**
 * Shared renderer for the two class-driven demos (plain Tailwind and
 * shadcn-style). The unstyled adapter ships no CSS — these `classNames`
 * (Tailwind utilities via the Play CDN) are the entire look.
 */
export function UnstyledLike({
  mode,
  locale,
  classNames,
  pageMode,
  urlKey,
  density = "comfortable",
  filtersUi,
  animate,
  grouping,
  editing,
  cellNavigation,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  classNames: DataTableClassNames;
  pageMode?: PageMode;
  urlKey?: string;
  density?: Density;
  filtersUi?: FiltersUi;
  animate?: boolean;
  grouping?: boolean;
  editing?: boolean;
  cellNavigation?: boolean;
}>) {
  const s = strings(locale);
  const styled = withDensity(classNames, density);
  return (
    <DemoBody
      mode={mode}
      pageMode={pageMode}
      urlKey={urlKey}
      defaultColumnLayout={LIVE_DEFAULT_LAYOUT}
      grouping={grouping}
      editing={editing}
      render={(source, columns) => {
        return (
          <DataTable
            source={source}
            columns={makeColumns(locale, TAILWIND_CELLS)}
            rowKey={(r) => r.id}
            cellNavigation={cellNavigation}
            {...columns}
            density={density}
            filtersMode={filtersUi}
            labels={getLabels(locale)}
            locale={locale}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            bulkActions={makeBulkActions(locale)}
            confirm={demoConfirm}
            enableColumnMenu
            exportCsv
            savedViews={demoSavedViews(urlKey)}
            animate={animate}
            resizableColumns
            stickyHeader
            classNames={styled}
            filters={demoFilterDefs(locale)}
          />
        );
      }}
    />
  );
}
