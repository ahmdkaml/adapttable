import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable, type DataTableClassNames } from "@adapttable/unstyled";

import {
  clearDemoFilters,
  demoConfirm,
  demoFilterChips,
  DemoFilters,
  type Locale,
  makeActions,
  makeColumns,
  makeFilterLabels,
  strings,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

/**
 * Shared renderer for the two class-driven demos (plain Tailwind and
 * shadcn-style). The unstyled adapter ships no CSS — these `classNames`
 * (Tailwind utilities via the Play CDN) are the entire look.
 */
export function UnstyledLike({
  mode,
  locale,
  classNames,
}: Readonly<{
  mode: DataMode;
  locale: Locale;
  classNames: DataTableClassNames;
}>) {
  const s = strings(locale);
  return (
    <DemoBody
      mode={mode}
      render={(source) => {
        return (
          <DataTable
            source={source}
            columns={makeColumns(locale)}
            rowKey={(r) => r.id}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
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
