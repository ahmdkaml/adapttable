# React table columns — ColumnDef, accessors, sorting, pinning & custom cells

▶ **Try it live:** [open a Mantine starter in StackBlitz](https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine?file=src%2FApp.tsx) — this page's feature is the starter's whole `columns` array in `src/App.tsx`; edit it in the browser, no install. [Other UI kits →](./getting-started.md#try-it-in-stackblitz)

Columns are plain objects — declare a `key` and the table renders the value, derives the header, and wires sorting and filtering around it. Everything beyond the key is an opt-in refinement.

## Example

```tsx
import { type CellProps, type ColumnDef, DataTable } from "@adapttable/mantine"; // or mui, chakra, antd, radix, shadcn, unstyled
import { Badge } from "@mantine/core";

interface Person {
  id: string;
  name: string;
  nameAr: string;
  department: { name: string };
  salary: number;
  status: "active" | "on-leave";
  hiredAt: string;
}

const people: Person[] = [
  {
    id: "1",
    name: "Amira Hassan",
    nameAr: "أميرة حسن",
    department: { name: "Engineering" },
    salary: 96000,
    status: "active",
    hiredAt: "2021-03-15",
  },
  {
    id: "2",
    name: "Tom Becker",
    nameAr: "توم بيكر",
    department: { name: "Design" },
    salary: 78000,
    status: "on-leave",
    hiredAt: "2022-11-01",
  },
  {
    id: "3",
    name: "Lina Park",
    nameAr: "لينا بارك",
    department: { name: "Engineering" },
    salary: 105000,
    status: "active",
    hiredAt: "2019-07-20",
  },
];

// Define Cell components at module level so their identity is stable.
function StatusCell({ row }: CellProps<Person>) {
  return (
    <Badge color={row.status === "active" ? "green" : "yellow"}>
      {row.status}
    </Badge>
  );
}

const columns: ColumnDef<Person>[] = [
  // Bare key: auto header "Name"; i18n swaps the data path when locale="ar".
  { key: "name", i18n: { ar: "nameAr" }, sortable: true },
  // Dot path reaches nested values; auto header "Department Name".
  { key: "department.name", header: "Department" },
  // accessor formats; sortValue keeps the column sortable by the raw number.
  {
    key: "salary",
    header: "Salary (USD)",
    accessor: (r) => r.salary.toLocaleString(),
    sortValue: (r) => r.salary,
    sortable: true,
    align: "end",
    width: 140,
  },
  // Cell: a full React component receiving { row, rowIndex }.
  { key: "status", Cell: StatusCell, mobileLabel: "Status" },
  { key: "hiredAt", hideOnMobile: true, meta: { exportFormat: "date" } },
];

export function People() {
  return (
    <DataTable
      data={people}
      columns={columns}
      rowKey={(r) => r.id}
      locale="en"
    />
  );
}
```

## How it works

- A bare `{ key }` is a complete column: the key doubles as the row's data path (dot paths reach nested values, `"department.name"`), and the header is auto-humanised (`hiredAt` → "Hired At"). An explicit `header` always wins, in any language.
- Cell content resolves `Cell` → `accessor` → the key's data path. `Cell` is a React component receiving `{ row, rowIndex }`; `accessor` is the lighter function form.
- `sortable` opts a column into sorting; on frontend data the comparator reads `sortValue`, falling back to the column's accessor. See [sorting](./sorting.md).
- `i18n` maps locale tags to alternative data paths; the table's `locale` prop picks one (exact tag → primary subtag → `key`). The cell, client-side sort, and the column's filter all follow the resolved path — header text does not.
- `hideOnMobile` / `hideOnDesktop` drop a column per layout; `mobileLabel` overrides the label on mobile cards.
- `key` is also the value sent to a backend as `sortBy`, so keep it API-stable.

## Options

| Prop            | Type                             | Default                      | Description                                                                                       |
| --------------- | -------------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------- |
| `key`           | `string`                         | required                     | Unique id; data path for the cell value; the backend `sortBy` value.                              |
| `header`        | `ReactNode`                      | humanised from `key`         | Header content, pre-translated by the caller.                                                     |
| `accessor`      | `(row) => ReactNode`             | read the key's data path     | Lightweight cell renderer.                                                                        |
| `Cell`          | `ComponentType<CellProps<TRow>>` | —                            | Component per row, receives `{ row, rowIndex }`; wins over `accessor`.                            |
| `sortable`      | `boolean`                        | `false`                      | Enable sorting for this column.                                                                   |
| `sortValue`     | `(row) => SortableValue`         | the generated accessor value | Primitive extractor for the client-side sort. See [sorting](./sorting.md).                        |
| `exportValue`   | `(row) => unknown`               | the display value            | Value written to a CSV export when the file should carry something other than the formatted cell. |
| `align`         | `"start" \| "center" \| "end"`   | `"start"`                    | Text alignment within the cell.                                                                   |
| `width`         | `number \| string`               | —                            | Width passed through to the rendered header/cell.                                                 |
| `mobileLabel`   | `string`                         | `header` (when a string)     | Label on mobile card layouts.                                                                     |
| `hideOnMobile`  | `boolean`                        | `false`                      | Hide the column entirely on mobile.                                                               |
| `hideOnDesktop` | `boolean`                        | `false`                      | Hide the column entirely on desktop.                                                              |
| `group`         | `string`                         | —                            | Spanning header above adjacent columns sharing the name. See below.                               |
| `i18n`          | `Record<string, string>`         | —                            | Per-locale data paths for the column's value.                                                     |
| `meta`          | `Record<string, unknown>`        | —                            | Free-form bag your own code can read back.                                                        |
| `locale`        | `string` (table prop)            | —                            | Active locale tag (`"ar"`, `"ar-EG"`); drives `i18n` path resolution.                             |

## Computed columns

A total, a margin, a full name, days-until-due — columns whose value is derived
rather than stored. Writing the derivation into `accessor` works until the
column has to do anything else: sorting then compares the formatted string, so
`"$1,240.00"` sorts before `"$90.00"`; filtering has nothing to match; the
export carries the formatting; and the function runs again for every cell on
every render.

`computed` declares the derivation once and wires all four surfaces from it:

```tsx
import { computed } from "@adapttable/core";

const columns = [
  { key: "quantity" },
  { key: "unitPrice" },
  computed<Order, number>({
    key: "total",
    header: "Total",
    deps: (row) => [row.quantity, row.unitPrice],
    value: (row) => row.quantity * row.unitPrice,
    format: (total) => money.format(total),
    column: { sortable: true, align: "end" },
  }),
];
```

The screen shows `$1,240.00`; sorting, filtering and export all see `1240`.

- **`deps` is required, and listing them is the whole contract.** The value is
  recomputed when any dependency changes and reused when none do. A field the
  derivation reads but does not declare becomes a stale cell the moment the
  data changes underneath it.
- **The result is cached per row**, in a `WeakMap` keyed by the row object — a
  row that leaves the page takes its cached value with it, so a long-lived
  table cannot grow a cache it never releases.
- **`format` is display only.** Leave it out and primitives and dates render as text; any other value renders empty, since an object has no useful reading in a cell.
- **`column` carries everything else** a column can be — `sortable`, `align`,
  `width`, `filter`, `hideOnMobile`. `accessor`, `sortValue` and `exportValue`
  are derived and cannot be set here, which is what keeps the four surfaces
  from disagreeing.

**Define the columns at module level, or memoise them.** The cache lives
inside the column `computed` returns, so rebuilding the column on every
render throws the cache away with it — values stay correct, nothing is
reused. It is the same rule `Cell` already asks for.

Rows must be objects, since the cache is keyed by row identity. The spec type is exported as `ComputedColumnSpec` for callers that build columns dynamically.

## Grouped headers

Give adjacent columns the same `group` and they render under one spanning
header cell:

```tsx
const columns: ColumnDef<Person>[] = [
  { key: "firstName", header: "First", group: "Name" },
  { key: "lastName", header: "Last", group: "Name" },
  { key: "city", header: "City", group: "Location" },
  { key: "country", header: "Country", group: "Location" },
  { key: "hiredAt", header: "Hired" },
];
```

```text
|      Name      |     Location      |        |
| First |  Last  |  City  | Country  | Hired  |
```

Columns without a `group` sit under a blank spanning cell, so the header row
always lines up. The grouping is **presentational and adjacency-based**: the
span is computed from the columns as they are currently ordered, so dragging a
column out of the middle of a group splits it into two spans rather than
pretending the layout is something it is not. Reorder them back together and
the group closes up again.

Groups are one level deep and carry no behaviour of their own — they do not
collapse, pin, or reorder as a unit. On mobile the card layout has no header
row, so `group` has no effect there.

## Notes

- Define `Cell` components at module level (or memoise them) — an inline component re-mounts every render and defeats row memoisation.
- Path-derived cells render primitives only; a non-primitive value at the path renders nothing. Use `accessor` or `Cell` for objects.
- A column whose `accessor` returns JSX needs `sortValue` to be sortable — without it the sort silently no-ops and a dev warning fires.
- `mobileLabel` only falls back to `header` when the header is a string; with a JSX header, set `mobileLabel` explicitly (it also names the column in the Columns menu).
- Duplicate column keys trigger a development warning — keys must be unique within the table.

See it live in the [demo](https://orwa-mahmoud.github.io/adapttable/demo/).
