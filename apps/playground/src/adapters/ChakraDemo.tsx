import { DataTable, useFrontendData } from "@adapttable/chakra";
import { ChakraProvider } from "@chakra-ui/react";

import { columns, editAction, PEOPLE } from "../data";

export function ChakraDemo() {
  const source = useFrontendData({ data: PEOPLE, columns });
  return (
    <ChakraProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search people…"
        rowActions={[editAction]}
      />
    </ChakraProvider>
  );
}
