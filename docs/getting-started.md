# Getting started

AdaptTable is a **headless, UI-agnostic React data table**. Pick the adapter
for your design system and you get a fully styled, sortable, filterable,
paginated table with URL-synced state, selection + bulk actions, RTL, and
dark mode — in about five lines.

## Install

The fastest path is the CLI, which detects your UI kit and scaffolds a
starter:

```bash
npx adapttable init
```

Or install manually (Mantine shown; swap for `mui`, `chakra`, `antd`, or
`unstyled`):

```bash
pnpm add @adapttable/core @adapttable/mantine @mantine/core @mantine/hooks react react-dom
```

## Your first table

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
table from a paginated API, swap in `useBackendData` (built on TanStack
Query's `useInfiniteQuery`). **The `<DataTable>` doesn't change** — both
hooks return the same [`TableSource`](./concepts.md).

```tsx
// Pass the row type; the default page shape is `{ items, total }`.
const source = useBackendData<Person>({ usePaginatedQuery });
```

## Next steps

- [Core concepts: the `TableSource` contract](./concepts.md)
- [URL-synced state](./url-state.md)
- [i18n & RTL](./i18n-rtl.md)
- [Customization](./customization.md)
- [API reference](./api.md)
