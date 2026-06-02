import { getDirection, getLabels } from "@adapttable/i18n";
import { DataTable, useFrontendData } from "@adapttable/unstyled";

import { columns, editAction, PEOPLE } from "../data";

// The unstyled adapter ships no CSS — you bring the classes. These are
// Tailwind utilities (loaded via the Play CDN in index.html).
export function UnstyledDemo() {
  const source = useFrontendData({ data: PEOPLE, columns });
  return (
    <DataTable
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      labels={getLabels("en")}
      dir={getDirection("en")}
      rowActions={[editAction]}
      classNames={{
        root: "rounded-lg border border-zinc-200 p-3",
        toolbar: "flex items-center gap-2 mb-2",
        search: "rounded border px-2 py-1 text-sm",
        table: "w-full text-sm",
        headerCell: "text-start font-medium text-zinc-500 px-3 py-2",
        sortButton: "inline-flex items-center gap-1",
        row: "border-t hover:bg-zinc-50 data-[selected]:bg-blue-50",
        cell: "px-3 py-2",
        footer: "flex items-center gap-2 mt-2 text-sm",
        pageButton: "rounded border px-2 py-1 disabled:opacity-40",
      }}
    />
  );
}
