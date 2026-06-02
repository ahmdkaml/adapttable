import { DataTable, useFrontendData } from "@adapttable/mantine";
import { MantineProvider } from "@mantine/core";

import { columns, editAction, PEOPLE } from "../data";

export function MantineDemo() {
  const source = useFrontendData({ data: PEOPLE, columns });
  return (
    <MantineProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search people…"
        rowActions={[editAction]}
      />
    </MantineProvider>
  );
}
