import { DataTable, useFrontendData } from "@adapttable/mui";

import { columns, editAction, PEOPLE } from "../data";

export function MuiDemo() {
  const source = useFrontendData({ data: PEOPLE, columns });
  return (
    <DataTable
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      searchPlaceholder="Search people…"
      rowActions={[editAction]}
    />
  );
}
