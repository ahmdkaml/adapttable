import "@mantine/core/styles.css";

import {
  type ColumnDef,
  DataTable,
  useFrontendData,
} from "@adapttable/mantine";
import { MantineProvider } from "@mantine/core";

interface Person {
  id: string;
  name: string;
  email: string;
  role: string;
}

const PEOPLE: Person[] = [
  { id: "1", name: "Ada Lovelace", email: "ada@example.com", role: "Engineer" },
  { id: "2", name: "Alan Turing", email: "alan@example.com", role: "Founder" },
  {
    id: "3",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "Admiral",
  },
];

const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "email", header: "Email", accessor: (r) => r.email },
  { key: "role", header: "Role", accessor: (r) => r.role, sortable: true },
];

/** Client-side data with sorting, search, pagination, and a row action. */
export function MantineBasicExample() {
  const source = useFrontendData({ data: PEOPLE, columns });
  return (
    <MantineProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        searchPlaceholder="Search people…"
        rowActions={[
          {
            key: "edit",
            label: "Edit",
            onClick: (row) => alert(`Edit ${row.name}`),
          },
        ]}
      />
    </MantineProvider>
  );
}
