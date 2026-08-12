import type { CellProps, ColumnDef } from "@adapttable/core";
import {
  applyRowPatches,
  updateRow,
  useFrontendData,
  useServerData,
} from "@adapttable/core";
import { getLabels } from "@adapttable/i18n";
import { DataTable } from "@adapttable/mantine";
import { MantineProvider } from "@mantine/core";
import { useEffect, useMemo, useState } from "react";

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
 *  to turn windowing OFF, `?all=1` to load the whole list up front, `?cols=N`
 *  to pad the table out to N columns, `?tier=server` to answer from a paged
 *  server instead of memory, `?edit=1` to make the cells editable, and
 *  `?patch=N` to apply N row patches after mount. They drive the benchmark
 *  suite (`scripts/bench.mjs`); every default is the demo a visitor sees. */
function scaleParams(): {
  total: number;
  virtual: boolean;
  all: boolean;
  cols: number;
  server: boolean;
  edit: boolean;
  patches: number;
} {
  const DEFAULTS = {
    total: 50000,
    virtual: true,
    all: false,
    cols: 0,
    server: false,
    edit: false,
    patches: 0,
  };
  if (typeof window === "undefined") return DEFAULTS;
  const p = new URLSearchParams(window.location.search);
  const int = (key: string) => {
    const value = Number(p.get(key));
    return Number.isInteger(value) && value > 0 ? value : 0;
  };
  return {
    total: int("rows") || DEFAULTS.total,
    virtual: p.get("virtualize") !== "0",
    all: p.get("all") === "1",
    cols: int("cols"),
    server: p.get("tier") === "server",
    edit: p.get("edit") === "1",
    patches: int("patch"),
  };
}

/**
 * Pad the column set out to `cols` for the wide-table benchmark: the real
 * columns first, then synthetic ones reading a rotating field. Returns the
 * untouched set when the knob is absent, so the demo is unaffected.
 */
function widen(
  columns: ColumnDef<BigPerson>[],
  cols: number,
  edit = false
): ColumnDef<BigPerson>[] {
  const base = edit
    ? columns.map((column) =>
        column.key === "budget"
          ? {
              ...column,
              editable: true,
              editor: "number" as const,
              editValue: (r: BigPerson) => String(r.budget),
            }
          : column
      )
    : columns;
  if (cols <= base.length) return base;
  const columnsIn = base;
  const extra: ColumnDef<BigPerson>[] = [];
  for (let i = columnsIn.length; i < cols; i++) {
    extra.push({
      key: `synthetic${i}`,
      header: `Col ${i}`,
      accessor: (r) => (i % 2 === 0 ? r.role : r.status),
      width: 120,
    });
  }
  return [...columnsIn, ...extra];
}

/**
 * One row of a dataset too big to hold, synthesized on demand.
 *
 * A million-row server tier cannot be faked by generating a million rows in the
 * tab — that measures the generator, not the table. Rows are derived from their
 * index instead, so a page costs a page and the reported total is honest.
 */
function serverRow(index: number): BigPerson {
  let seed = (index + 1) * 2654435761;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  const f = FIRST[(rnd() * FIRST.length) | 0];
  const l = LAST[(rnd() * LAST.length) | 0];
  return {
    id: index + 1,
    name: `${f} ${l}`,
    email: `${f}.${l}`.toLowerCase() + index + "@northwind.io",
    role: ROLES[(rnd() * ROLES.length) | 0],
    status: STATUSES[(rnd() * STATUSES.length) | 0],
    budget: 40000 + ((rnd() * 180000) | 0),
  };
}

/**
 * The server-backed arm: the table asks for a slice, this answers it, and the
 * browser never holds the set. `total` is what the pager and the ARIA counts
 * report, so 1,000,000 means 1,000,000.
 */
function ServerScaleTable({
  total,
  columns,
  virtual,
  dark,
}: Readonly<{
  total: number;
  columns: ColumnDef<BigPerson>[];
  virtual: boolean;
  dark: boolean;
}>) {
  const [page, setPage] = useState({ from: 0, limit: 500 });
  const rows = useMemo(
    () =>
      Array.from({ length: Math.min(page.limit, total - page.from) }, (_, i) =>
        serverRow(page.from + i)
      ),
    [page, total]
  );
  const source = useServerData<BigPerson>({
    rows,
    total,
    urlKey: "scale",
    paginationMode: "infinite",
    defaults: { limit: 500 },
    onQueryChange: (query) => {
      setPage({ from: (query.page - 1) * query.limit, limit: query.limit });
    },
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
        stickyHeader
        stickyTop={62}
      />
    </MantineProvider>
  );
}

/** The real Mantine adapter, element-virtualized over tens of thousands of rows. */
export function ScaleDemo({ dark }: Readonly<{ dark: boolean }>) {
  const { total, virtual, all, cols, server, edit, patches } = scaleParams();
  const columns = useMemo(() => widen(COLUMNS, cols, edit), [cols, edit]);
  if (server) {
    return (
      <ServerScaleTable
        total={total}
        columns={columns}
        virtual={virtual}
        dark={dark}
      />
    );
  }
  return (
    <FrontendScaleTable
      total={total}
      columns={columns}
      virtual={virtual}
      all={all}
      edit={edit}
      patches={patches}
      dark={dark}
    />
  );
}

/** The in-memory arm, plus the editing and realtime-patch scenarios. */
function FrontendScaleTable({
  total,
  columns,
  virtual,
  all,
  edit,
  patches,
  dark,
}: Readonly<{
  total: number;
  columns: ColumnDef<BigPerson>[];
  virtual: boolean;
  all: boolean;
  edit: boolean;
  patches: number;
  dark: boolean;
}>) {
  const initial = useMemo(() => makeBigList(total), [total]);
  const [rows, setRows] = useState(initial);
  // Realtime patches: `?patch=N` applies N updates through the patch API the
  // same way a websocket would, then marks the DOM so the benchmark can time
  // the whole burst rather than guess at it.
  const [applied, setApplied] = useState(0);
  useEffect(() => {
    if (patches <= 0) return;
    let done = 0;
    const byId = (row: BigPerson) => String(row.id);
    const tick = () => {
      setRows((current) => [
        ...applyRowPatches(
          current,
          [
            updateRow<BigPerson>(String((done % total) + 1), {
              budget: 40000 + ((done * 977) % 180000),
            }),
          ],
          byId
        ),
      ]);
      done += 1;
      setApplied(done);
      if (done < patches) queueMicrotask(tick);
    };
    tick();
  }, [patches, total]);
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
      {/* The benchmark reads this to know the patch burst finished. */}
      <div data-bench-patches={patches > 0 ? applied : undefined}>
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
          onCellEdit={
            edit
              ? (row, _key, nextValue) => {
                  setRows((current) => [
                    ...applyRowPatches(
                      current,
                      [
                        updateRow<BigPerson>(String(row.id), {
                          budget: Number(nextValue),
                        }),
                      ],
                      (r) => String(r.id)
                    ),
                  ]);
                }
              : undefined
          }
        />
      </div>
    </MantineProvider>
  );
}
