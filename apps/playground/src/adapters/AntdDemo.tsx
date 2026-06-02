import { DataTable } from "@adapttable/antd";
import { getDirection, getLabels } from "@adapttable/i18n";
import { Checkbox, ConfigProvider } from "antd";

import {
  type Locale,
  makeActions,
  makeColumns,
  makeFilterLabels,
  selectedTeams,
  strings,
  TEAMS,
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
            onClearFilters={() => source.setExtra("team", undefined)}
            filters={
              <Checkbox.Group
                style={{ display: "flex", flexDirection: "column", gap: 8 }}
                options={TEAMS}
                value={selectedTeams(source.extra.team)}
                onChange={(value) => source.setExtra("team", value)}
              />
            }
          />
        )}
      />
    </ConfigProvider>
  );
}
