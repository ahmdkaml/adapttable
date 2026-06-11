# Getting started

AdaptTable is a **headless, UI-agnostic React data table**. Pick the adapter
for your design system and you get a fully styled, sortable, filterable,
paginated table with URL-synced state, selection + bulk actions, RTL, and
dark mode — in about five lines.

## Install

The fastest path is the CLI, which detects your UI kit and scaffolds a
starter:

```bash
npx @adapttable/cli init
```

Or install manually (Mantine shown; swap for `mui`, `chakra`, `antd`, or
`unstyled`):

```bash
pnpm add @adapttable/core @adapttable/mantine @mantine/core @mantine/hooks react react-dom
```

## Your first table — zero ceremony

Each adapter renders with its UI kit's own components, so your app needs that
kit's provider once at the root — exactly as the kit's docs describe (Mantine
shown; MUI/Chakra/antd use their own providers, and the unstyled adapter
needs none):

```tsx
// main.tsx — once per app, straight from Mantine's own setup guide.
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";

<MantineProvider>
  <App />
</MantineProvider>;
```

Then pass `data` and declare columns — that's the whole thing:

```tsx
import { DataTable } from "@adapttable/mantine";

export function People({ data }: { data: Person[] }) {
  return (
    <DataTable
      data={data}
      columns={[
        { key: "name", sortable: true },
        { key: "department.name" },
        { key: "status", filter: { type: "select", options: STATUSES } },
        { key: "hiredAt", filter: "dateRange" },
        { key: "salary", filter: "numberRange" },
      ]}
      rowKey={(r) => r.id}
    />
  );
}
```

What you just got without writing any of it: search, sorting, pagination,
URL-synced state (reload-safe, shareable links), and a **filter form built
from those `filter` declarations** with kit-native widgets — each filter also
drives its own removable chip, URL parsing, and row predicate. Headers
auto-derive from keys (`hiredAt` → "Hired At"; pass `header` to control the
text in any language), and dot-path keys reach nested values. Filters that
aren't columns go in a table-level array:

```tsx
<DataTable
  data={data}
  columns={columns}
  filters={[
    { key: "companyId", type: "select", label: "Company", options: companies },
    { key: "budget", type: "numberRange" },
  ]}
  rowKey={(r) => r.id}
/>
```

## Server data without a query library

Keep the same table, add `onQueryChange`: the table owns the query state
(URL, widgets, chips, debounce) and emits one consolidated event per real
change — including the initial mount with URL-restored values. Forward the
`signal` and out-of-order responses are aborted for you:

```tsx
const [rows, setRows] = useState<Person[]>([]);
const [total, setTotal] = useState(0);
const [loading, setLoading] = useState(false);

<DataTable
  data={rows}
  total={total}
  loading={loading}
  onQueryChange={async (q, { signal }) => {
    setLoading(true);
    const res = await fetch(api.people(q), { signal }).then((r) => r.json());
    setRows(res.items);
    setTotal(res.total);
    setLoading(false);
  }}
  columns={columns}
  rowKey={(r) => r.id}
/>;
```

## Full control with a source (query libraries)

For TanStack Query integration, caching, infinite scroll and prefetching,
build a `source` — everything else stays identical:

```tsx
import {
  DataTable,
  useFrontendData,
  type ColumnDef,
} from "@adapttable/mantine";

interface Person {
  id: string;
  name: string;
  city: string;
}

const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "city", header: "City", accessor: (r) => r.city },
];

export function People({ data }: { data: Person[] }) {
  const source = useFrontendData({ data, columns });
  return <DataTable source={source} columns={columns} rowKey={(r) => r.id} />;
}
```

That's it — sorting, search, pagination, empty/loading states, and a
mobile card layout all work out of the box.

## Client vs. server data

`useFrontendData` filters/sorts/slices an in-memory array. To drive the same
table from a paginated API, swap in `useBackendData`: you write one
`useInfiniteQuery` hook (TanStack Query — wrap your app in its
`QueryClientProvider`) and AdaptTable adapts it. **The `<DataTable>` doesn't
change** — both hooks return the same [`TableSource`](./concepts.md).

```tsx
import { keepPreviousData, useInfiniteQuery } from "@tanstack/react-query";
import { type TableQueryParams, useBackendData } from "@adapttable/mantine";

// Your query hook: fetch one page for the current params.
function usePeopleQuery(params: Partial<TableQueryParams>) {
  return useInfiniteQuery({
    queryKey: ["people", params],
    queryFn: ({ pageParam }) => fetchPeople({ ...params, page: pageParam }), // → { items, total, page, limit, hasNext }
    initialPageParam: params.page ?? 1,
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    placeholderData: keepPreviousData,
  });
}

// Pass the row type; the default page shape is `{ items, total, … }`.
const source = useBackendData<Person>({ usePaginatedQuery: usePeopleQuery });
```

See [`examples/mui-backend.tsx`](../examples/mui-backend.tsx) for a complete
runnable version.

## Turn on column management

The Columns menu (show/hide, drag/keyboard reorder, pin) and resize handles
are one prop each:

```tsx
<DataTable
  source={source}
  columns={columns}
  rowKey={(r) => r.id}
  enableColumnMenu
  resizableColumns
/>
```

See [customization](./customization.md) for presets (`defaultColumnLayout`),
URL persistence, and `density`.

## Next steps

- [Core concepts: the `TableSource` contract](./concepts.md)
- [URL-synced state](./url-state.md)
- [i18n & RTL](./i18n-rtl.md)
- [Customization](./customization.md)
- [API reference](./api.md)
