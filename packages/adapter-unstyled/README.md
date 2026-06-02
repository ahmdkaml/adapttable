# @adapttable/unstyled

The **headless, unstyled** adapter for [AdaptTable](https://github.com/orwa-mahmoud/adapttable).
Renders semantic HTML with `data-adapttable-part` + `data-*` state hooks
and per-part `className` overrides — style it with **Tailwind**, **shadcn/ui**,
or your own CSS. Ships zero styles.

```bash
pnpm add @adapttable/unstyled @adapttable/core react react-dom
```

## Quickstart

```tsx
import {
  DataTable,
  useFrontendData,
  type ColumnDef,
} from "@adapttable/unstyled";

const columns: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "city", header: "City", accessor: (r) => r.city },
];

export function People({ data }: { data: Person[] }) {
  const source = useFrontendData({ data, columns });
  return (
    <DataTable
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      classNames={{
        table: "w-full text-sm",
        headerCell: "text-left font-medium text-zinc-500 px-3 py-2",
        row: "border-b hover:bg-zinc-50 data-[selected]:bg-blue-50",
        cell: "px-3 py-2",
      }}
    />
  );
}
```

## Styling hooks

Every node carries:

- `data-adapttable-part="…"` — `root`, `toolbar`, `search`, `table`, `row`,
  `cell`, `header-cell`, `sort-button`, `chips`, `chip`, `bulk-bar`,
  `footer`, `empty`, `loading`, `error`, `card`, …
- `data-*` state — `data-selected` on selected rows/cards, `data-sorted`
  (`asc`/`desc`) on the active header, `data-mobile` on the root.
- A per-part `className` from the `classNames` prop.

Target them with attribute selectors (`[data-adapttable-part="row"]`),
Tailwind data variants (`data-[selected]:bg-blue-50`), or class overrides.

Everything else — client/server data, URL state, sorting, filtering,
selection + bulk actions, RTL (`dir`), auto desktop/mobile — works the same
as the other adapters, on the headless `@adapttable/core` engine.

## License

[MIT](../../LICENSE) © Orwa Mahmoud
