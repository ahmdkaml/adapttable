# @adapttable/mantine

The **Mantine adapter** for [AdaptTable](https://github.com/orwa-mahmoud/adapttable) —
a batteries-included React data table with sorting, filtering, URL-synced
state, selection + bulk actions, RTL, dark mode, and optional entrance
animation. Built on the headless `@adapttable/core` engine.

```bash
pnpm add @adapttable/mantine @adapttable/core @mantine/core @mantine/hooks react react-dom
```

## Quickstart

```tsx
import "@mantine/core/styles.css";
import { MantineProvider } from "@mantine/core";
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
  return (
    <MantineProvider>
      <DataTable source={source} columns={columns} rowKey={(r) => r.id} />
    </MantineProvider>
  );
}
```

Swap `useFrontendData` for `useBackendData` to drive the same table from a
server-paginated `useInfiniteQuery` — nothing else changes.

## Features

- **Client or server data** through one `TableSource` contract.
- **URL-synced** search / sort / filters / page (shareable links).
- **Sorting** with accessible header controls.
- **Filter drawer + removable chips** (`filters` + `filterLabels`).
- **Selection + bulk actions** with confirm dialogs (`bulkActions`).
- **Row actions** with optional confirm.
- **Auto desktop table ↔ mobile cards** by viewport (or force `isMobile`).
- **RTL** via the `dir` prop; **dark mode** via Mantine's color scheme.
- **Optional entrance animation** (`animate`) — dependency-free, honors
  `prefers-reduced-motion`.
- **Customisation**: `slots`, `classNames`, custom `toolbar`, injectable
  `confirm`, and full headless escape hatch via `@adapttable/core`.

## License

[MIT](../../LICENSE) © Orwa Mahmoud
