import { DataTable } from "@adapttable/antd";
import { Checkbox, ConfigProvider } from "antd";

import {
  columns,
  editAction,
  selectedTeams,
  TEAM_FILTER_LABELS,
  TEAMS,
} from "../data";
import { type DataMode, DemoBody } from "../Demo";

export function AntdDemo({ mode }: Readonly<{ mode: DataMode }>) {
  return (
    <ConfigProvider>
      <DemoBody
        mode={mode}
        render={(source) => (
          <DataTable
            source={source}
            columns={columns}
            rowKey={(r) => r.id}
            searchPlaceholder="Search people…"
            rowActions={[editAction]}
            filterLabels={TEAM_FILTER_LABELS}
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
