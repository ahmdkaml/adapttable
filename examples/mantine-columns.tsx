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
  team: string;
  status: string;
  budget: number;
}

const PEOPLE: Person[] = [
  {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    role: "Engineer",
    team: "Core",
    status: "Active",
    budget: 25_300,
  },
  {
    id: "2",
    name: "Alan Turing",
    email: "alan@example.com",
    role: "Founder",
    team: "Platform",
    status: "Blocked",
    budget: 32_600,
  },
  {
    id: "3",
    name: "Grace Hopper",
    email: "grace@example.com",
    role: "Admiral",
    team: "Data",
    status: "Archived",
    budget: 39_900,
  },
];

const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "email", header: "Email", accessor: (r) => r.email },
  { key: "role", header: "Role", accessor: (r) => r.role, sortable: true },
  { key: "team", header: "Team", accessor: (r) => r.team },
  { key: "status", header: "Status", accessor: (r) => r.status },
  {
    key: "budget",
    header: "Budget",
    accessor: (r) => `$${r.budget.toLocaleString()}`,
    sortable: true,
  },
];

/**
 * Full column management: the built-in "Columns" menu (show/hide, drag- or
 * keyboard-reorder, pin), drag/keyboard column resizing, and an initial layout
 * that pins "Name" to the left. `maxHeight` turns on the scroll box so pinned
 * columns actually stick while the table scrolls sideways.
 */
export function MantineColumnsExample() {
  const source = useFrontendData({ data: PEOPLE, columns });
  return (
    <MantineProvider>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        enableColumnMenu
        resizableColumns
        maxHeight={420}
        defaultColumnLayout={{
          pinned: { name: "left" },
          widths: { name: 220 },
        }}
      />
    </MantineProvider>
  );
}
