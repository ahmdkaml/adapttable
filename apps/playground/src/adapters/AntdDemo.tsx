import { DataTable, useFrontendData } from "@adapttable/antd";
import { ConfigProvider } from "antd";

import { columns, editAction, PEOPLE } from "../data";

export function AntdDemo() {
  const source = useFrontendData({ data: PEOPLE, columns });
  return (
    <ConfigProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search people…"
        rowActions={[editAction]}
      />
    </ConfigProvider>
  );
}
