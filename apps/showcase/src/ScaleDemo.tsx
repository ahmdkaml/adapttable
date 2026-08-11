import type { CellProps, ColumnDef } from "@adapttable/core";
import { useFrontendData } from "@adapttable/core";
import { getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mantine";
import { MantineProvider } from "@mantine/core";
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
      <div style={{ fontSize: 12, color: "var(--mantine-color-dimmed)" }}>
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

/** Scale-demo knobs from the URL — `?rows=N` (default 50,000), `?virtualize=0`
 *  to turn windowing OFF, `?all=1` to load the whole list up front, and
 *  `?cols=N` to pad the table out to N columns. They drive the benchmark
 *  suite (`scripts/bench.mjs`); every default is the demo a visitor sees. */
function scaleParams(): {
  total: number;
  virtual: boolean;
  all: boolean;
  cols: number;
} {
  if (typeof window === "undefined")
    return { total: 50000, virtual: true, all: false, cols: 0 };
  const p = new URLSearchParams(window.location.search);
  const n = Number(p.get("rows"));
  const c = Number(p.get("cols"));
  return {
    total: Number.isInteger(n) && n > 0 ? n : 50000,
    virtual: p.get("virtualize") !== "0",
    all: p.get("all") === "1",
    cols: Number.isInteger(c) && c > 0 ? c : 0,
  };
}

/**
 * Pad the column set out to `cols` for the wide-table benchmark: the real
 * columns first, then synthetic ones reading a rotating field. Returns the
 * untouched set when the knob is absent, so the demo is unaffected.
 */
function widen(
  columns: ColumnDef<BigPerson>[],
  cols: number
): ColumnDef<BigPerson>[] {
  if (cols <= columns.length) return columns;
  const extra: ColumnDef<BigPerson>[] = [];
  for (let i = columns.length; i < cols; i++) {
    extra.push({
      key: `synthetic${i}`,
      header: `Col ${i}`,
      accessor: (r) => (i % 2 === 0 ? r.role : r.status),
      width: 120,
    });
  }
  return [...columns, ...extra];
}

/** The real Mantine adapter, element-virtualized over tens of thousands of rows. */
export function ScaleDemo({ dark }: Readonly<{ dark: boolean }>) {
  const { total, virtual, all, cols } = scaleParams();
  const rows = useMemo(() => makeBigList(total), [total]);
  const columns = useMemo(() => widen(COLUMNS, cols), [cols]);
  const source = useFrontendData<BigPerson>({
    data: rows,
    columns,
    urlKey: "scale",
    // Virtualization needs a continuous list, not pages: infinite mode keeps
    // ONE growing window that the virtualizer extends automatically whenever
    // the scroller nears the end (no Load-more button needed). `?all=1` loads
    // the whole list up front so the non-virtualized A/B arm renders every row.
    paginationMode: "infinite",
    defaults: { limit: all ? total : 500 },
  });
  return (
    <MantineProvider forceColorScheme={dark ? "dark" : "light"}>
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => String(r.id)}
        labels={getLabels("en")}
        searchPlaceholder={`Filter ${total.toLocaleString("en-US")} rows…`}
        virtualize={virtual}
        estimateRowSize={48}
        // Page-scroll window mode with a pinned header: the page itself
        // scrolls the 50k rows while the header sticks under the app nav.
        stickyHeader
        stickyTop={62}
      />
    </MantineProvider>
  );
}
