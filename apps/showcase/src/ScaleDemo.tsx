import type { CellProps, ColumnDef } from "@adapttable/core";
import { useFrontendData } from "@adapttable/core";
import { getLabels } from "@adapttable/i18n";
import { DataTable, type DataTableClassNames } from "@adapttable/unstyled";
import { useMemo } from "react";

interface BigPerson {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  budget: number;
}

const FIRST = [
  "Amara",
  "Diego",
  "Priya",
  "Sefa",
  "Lena",
  "Marcus",
  "Yuki",
  "Fatima",
  "Tomas",
  "Chioma",
  "Henrik",
  "Sofia",
  "Omar",
  "Grace",
  "Noah",
  "Aisha",
  "Lucas",
  "Mira",
  "Daniel",
  "Elena",
  "Kwame",
  "Bella",
  "Rohan",
  "Hannah",
];
const LAST = [
  "Okafor",
  "Marchetti",
  "Nair",
  "Demir",
  "Hoffmann",
  "Bell",
  "Tanaka",
  "Al-Sayed",
  "Novak",
  "Eze",
  "Larsson",
  "Reyes",
  "Haddad",
  "Liu",
  "Schmidt",
];
const ROLES = [
  "Staff Engineer",
  "Product Designer",
  "Eng Manager",
  "Frontend Engineer",
  "Data Scientist",
  "Backend Engineer",
  "DevOps Engineer",
  "QA Engineer",
];
const STATUSES = ["Active", "Paid", "Open", "Blocked", "Archived"];

/** Deterministic 50k-row generator (seeded, no Math.random). */
function makeBigList(n: number): BigPerson[] {
  const out: BigPerson[] = new Array<BigPerson>(n);
  let seed = 1337;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < n; i++) {
    const f = FIRST[(rnd() * FIRST.length) | 0];
    const l = LAST[(rnd() * LAST.length) | 0];
    out[i] = {
      id: i + 1,
      name: `${f} ${l}`,
      email:
        `${f}.${l}`.toLowerCase().replace(/[^a-z.]/g, "") + i + "@northwind.io",
      role: ROLES[(rnd() * ROLES.length) | 0],
      status: STATUSES[(rnd() * STATUSES.length) | 0],
      budget: 40000 + ((rnd() * 180000) | 0),
    };
  }
  return out;
}

const money = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function PersonCell({ row }: Readonly<CellProps<BigPerson>>) {
  return (
    <div>
      <div style={{ fontWeight: 600 }}>{row.name}</div>
      <div style={{ fontSize: 12, color: "var(--color-muted-foreground)" }}>
        {row.email}
      </div>
    </div>
  );
}

const COLUMNS: ColumnDef<BigPerson>[] = [
  {
    key: "name",
    header: "Person",
    sortable: true,
    sortValue: (r) => r.name,
    Cell: PersonCell,
  },
  { key: "role", header: "Role", accessor: (r) => r.role },
  { key: "status", header: "Status", accessor: (r) => r.status },
  {
    key: "budget",
    header: "Budget",
    align: "end",
    sortable: true,
    sortValue: (r) => r.budget,
    accessor: (r) => money.format(r.budget),
  },
];

const CLASS_NAMES: DataTableClassNames = {
  root: "text-card-foreground",
  toolbar: "flex flex-wrap items-center gap-2 p-3 border-b border-border",
  search:
    "h-9 w-72 rounded-md border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring",
  table: "w-full border-collapse text-sm",
  headerCell:
    "border-b border-border bg-card px-3 py-2 text-start font-medium text-muted-foreground",
  sortButton: "inline-flex items-center gap-1 font-medium",
  row: "border-b border-border hover:bg-muted/50",
  cell: "px-3 py-2",
  footer:
    "flex items-center justify-between gap-2 border-t border-border p-3 text-sm text-muted-foreground",
};

/** Real unstyled adapter, virtualized over 50,000 rows. */
export function ScaleDemo() {
  const rows = useMemo(() => makeBigList(50000), []);
  const source = useFrontendData<BigPerson>({ data: rows, columns: COLUMNS });
  return (
    <DataTable
      source={source}
      columns={COLUMNS}
      rowKey={(r) => String(r.id)}
      labels={getLabels("en")}
      searchPlaceholder="Filter 50,000 rows…"
      virtualize
      estimateRowSize={48}
      maxHeight={380}
      classNames={CLASS_NAMES}
    />
  );
}
