import { DataTable } from "@adapttable/antd";
import { getDirection, getLabels } from "@adapttable/i18n";
import { ConfigProvider } from "antd";

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

export function AntdDemo({
  mode,
  locale,
}: Readonly<{ mode: DataMode; locale: Locale }>) {
  const s = strings(locale);
  return (
    <ConfigProvider direction={getDirection(locale)}>
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
            filterLabels={makeFilterLabels(locale)}
            extraChips={demoFilterChips(source, locale)}
            onClearFilters={() => clearDemoFilters(source)}
            filters={<DemoFilters source={source} locale={locale} />}
          />
        )}
      />
    </ConfigProvider>
  );
}
