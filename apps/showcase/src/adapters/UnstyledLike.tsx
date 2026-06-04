import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable, type DataTableClassNames } from "@adapttable/unstyled";

import {
  type AvatarCellProps,
  clearDemoFilters,
  type DemoCells,
  demoConfirm,
  demoFilterChips,
  DemoFilters,
  initials,
  type LoadCellProps,
  type Locale,
  makeActions,
  makeBulkActions,
  makeColumns,
  makeFilterLabels,
  nameHue,
  type StatusCellProps,
  statusTone,
  strings,
} from "../data";
import { type DataMode, DemoBody, type PageMode } from "../Demo";

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
      className="inline-grid h-9 w-9 place-items-center rounded-full text-xs font-bold"
      style={{
        background: `hsl(${nameHue(name)} 60% 88%)`,
        color: `hsl(${nameHue(name)} 45% 35%)`,
      }}
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
 * Shared renderer for the two class-driven demos (plain Tailwind and
 * shadcn-style). The unstyled adapter ships no CSS — these `classNames`
 * (Tailwind utilities via the Play CDN) are the entire look.
 */
export function UnstyledLike({
  mode,
  locale,
  classNames,
  pageMode,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  classNames: DataTableClassNames;
  pageMode?: PageMode;
}>) {
  const s = strings(locale);
  return (
    <DemoBody
      mode={mode}
      pageMode={pageMode}
      render={(source) => {
        return (
          <DataTable
            source={source}
            columns={makeColumns(locale, TAILWIND_CELLS)}
            rowKey={(r) => r.id}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            bulkActions={makeBulkActions(locale)}
            confirm={demoConfirm}
            enableColumnMenu
            resizableColumns
            stickyHeader
            virtualize
            estimateRowSize={56}
            estimateCardSize={140}
            filterLabels={makeFilterLabels(locale)}
            extraChips={demoFilterChips(source, locale)}
            onClearFilters={() => clearDemoFilters(source)}
            classNames={classNames}
            filters={<DemoFilters source={source} locale={locale} />}
          />
        );
      }}
    />
  );
}
