import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mantine";
import { MantineProvider } from "@mantine/core";

import {
  clearDemoFilters,
  demoFilterChips,
  DemoFilters,
  type Locale,
  makeActions,
  makeColumns,
  makeFilterLabels,
  strings,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

export function MantineDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  const s = strings(locale);
  return (
    <MantineProvider>
      <DemoBody
        mode={mode}
        render={(source) => (
          <DataTable
            source={source}
            columns={makeColumns(locale)}
            rowKey={(r) => r.id}
            labels={getLabels(locale)}
            dir={getDirection(locale)}
            searchPlaceholder={s.search}
            rowActions={makeActions(locale)}
            virtualize
            estimateRowSize={56}
            estimateCardSize={140}
            stickyTop={12}
            filterLabels={makeFilterLabels(locale)}
            extraChips={demoFilterChips(source, locale)}
            onClearFilters={() => clearDemoFilters(source)}
            filters={<DemoFilters source={source} locale={locale} />}
          />
        )}
      />
    </MantineProvider>
  );
}
