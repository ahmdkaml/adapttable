# @adapttable/chakra

The **Chakra UI adapter** for [AdaptTable](https://github.com/orwa-mahmoud/adapttable) —
a batteries-included Chakra data table with sorting, filtering, URL-synced
state, selection + bulk actions, RTL, and dark mode. Built on the headless
`@adapttable/core` engine. (Targets Chakra UI **v2**.)

```bash
pnpm add @adapttable/chakra @adapttable/core @chakra-ui/react @emotion/react @emotion/styled framer-motion react react-dom
```

## Quickstart

```tsx
import { ChakraProvider } from "@chakra-ui/react";
import { DataTable, useFrontendData, type ColumnDef } from "@adapttable/chakra";

const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "city", header: "City", accessor: (r) => r.city },
];

export function People({ data }: { data: Person[] }) {
  const source = useFrontendData({ data, columns });
  return (
    <ChakraProvider>
      <DataTable source={source} columns={columns} rowKey={(r) => r.id} />
    </ChakraProvider>
  );
}
```

Dark mode follows Chakra's color mode; pass `colorScheme` to tint accents.
Swap `useFrontendData` for `useBackendData` to drive the same table from a
server-paginated query.

## Features

Sortable headers, `Checkbox` selection + bulk actions with confirm, `Tag`
filter chips, `Drawer` filters, prev/next pagination, `Skeleton`/`Alert`
states, auto desktop table ↔ mobile cards, RTL (`dir`), `slots`, `size`,
and an injectable `confirm`.

## License

[MIT](../../LICENSE) © Orwa Mahmoud
