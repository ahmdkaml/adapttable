<div align="center">

# AdaptTable

### The headless React data table that works with **any** UI kit — batteries-included for Mantine, MUI, Chakra, and Tailwind/shadcn.

**Easy by default, infinitely customizable.** One unified data source for both client-side and server-side data, URL-synced shareable state, infinite-scroll & paging (auto by device), a real filter UX, first-class **i18n + RTL**, and seamless **dark mode** — out of the box.

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6.svg)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](./CONTRIBUTING.md)

</div>

---

## Why AdaptTable?

Most React tables force a choice: **headless freedom** (you build all the UI yourself) **or** **batteries-included** (locked to one design system). AdaptTable gives you **both from the same core** — a truly headless engine plus ready-to-drop styled adapters for the UI kit you already use.

```tsx
// Batteries-included — 5 lines to a fully styled, sortable, filterable, paginated table.
import { DataTable, useFrontendData } from "@adapttable/mantine";

function People({ rows }) {
  const source = useFrontendData({ data: rows });
  return <DataTable source={source} columns={columns} rowKey={(r) => r.id} />;
}
```

```tsx
// Headless — full control, zero opinions, render your own markup.
import { useDataTable } from "@adapttable/core";

const { getTableProps, getRowProps, rows } = useDataTable({
  source,
  columns,
  rowKey,
});
```

## Feature comparison

| Feature                                        |  ag-grid   |     TanStack Table      | mantine-datatable | MUI DataGrid |      **AdaptTable**      |
| ---------------------------------------------- | :--------: | :---------------------: | :---------------: | :----------: | :----------------------: |
| Headless core                                  |     ✗      |            ✓            |         ✗         |      ✗       |          **✓**           |
| Works across UI kits                           |     ✗      | ✓ _(build UI yourself)_ |   Mantine only    |   MUI only   | **✓ via ready adapters** |
| Client **and** server data, same API           |  partial   |    wire it yourself     |         ✗         |   partial    |  **✓ (`TableSource`)**   |
| URL-synced state (shareable links)             |     ✗      |            ✗            |         ✗         |      ✗       |          **✓**           |
| Filter drawer + removable chips                |     ✗      |            ✗            |         ✗         |   partial    |      **✓ built-in**      |
| Infinite scroll **and** paged (auto by device) |     ✓      |      ✓ _(manual)_       |    paged only     |  ✓ _(paid)_  |   **✓ auto by device**   |
| i18n + **RTL / Arabic** first-class            |  partial   |            ✗            |         ✗         |   partial    |          **✓**           |
| Dark mode                                      |     ✓      |           n/a           |         ✓         |      ✓       |      **✓ seamless**      |
| MIT / free                                     | paid tiers |            ✓            |         ✓         |  paid tiers  |          **✓**           |

> **The niche:** _TanStack-Table-style headless freedom, but batteries-included for your UI kit — with URL state, RTL, and a real filter UX out of the box._

## Packages

| Package                | What it is                                                               |
| ---------------------- | ------------------------------------------------------------------------ |
| `@adapttable/core`     | Headless engine. Zero UI-kit imports. Hooks, state, prop-getters, types. |
| `@adapttable/mantine`  | Mantine adapter — batteries-included `<DataTable>`.                      |
| `@adapttable/mui`      | Material UI adapter.                                                     |
| `@adapttable/chakra`   | Chakra UI adapter.                                                       |
| `@adapttable/unstyled` | Headless primitives + Tailwind / shadcn classes.                         |
| `@adapttable/i18n`     | Optional locale presets (en, ar) + RTL helpers.                          |
| `@adapttable/cli`      | `npx adapttable init` — detects your UI kit and scaffolds a table.       |

## Install

```bash
# Pick your adapter — the CLI can auto-detect and do this for you:
npx adapttable init

# …or install manually:
pnpm add @adapttable/core @adapttable/mantine
```

## The big idea: `TableSource`

Every data source — in-memory or server-paginated — fulfils one contract. The table is agnostic to where rows came from:

```ts
const source = useBackendData({ usePaginatedQuery }); // server-side, infinite or paged
const source = useFrontendData({ data }); // client-side filter/sort/slice
// Both return the same TableSource<T>. Swap freely; the UI never changes.
```

## Customization spectrum — easy ↔ pro

1. **Props** — `columns`, `source`, `searchPlaceholder`, `sortByOptions`, `rowActions`, `bulkActions`, `filters`, `dir`, …
2. **`slots`** — replace the `skeleton` and `empty` sub-parts with your own components.
3. **`classNames` per part** — restyle without replacing (the **unstyled** adapter exposes a class hook + `data-*` state attribute for every node).
4. **A custom `toolbar` slot** and an **injectable `confirm`** handler for action dialogs.
5. **Prop-getters (fully headless)** — build the entire markup yourself with `@adapttable/core`.

See [docs/customization.md](./docs/customization.md) for details.

## i18n, RTL & dark mode

- **Core is i18n-agnostic** — pass `labels` (or a `t` function). Use _your_ i18n stack, or grab ready `en`/`ar` sets from `@adapttable/i18n`.
- **RTL** is first-class: `dir="rtl"` flows through logical CSS and each adapter's direction provider.
- **Dark mode** follows the host app or `prefers-color-scheme`, mapped to each kit's theming.

## Animations (optional)

Row/card stagger on mount is **opt-in**, dependency-free (no GSAP required), and pluggable. Use it, swap it, or run with no animation at all — your call. Always honours `prefers-reduced-motion`.

## Documentation

- [Getting started](./docs/getting-started.md)
- [Core concepts: `TableSource`](./docs/concepts.md)
- [URL-synced state](./docs/url-state.md)
- [i18n & RTL](./docs/i18n-rtl.md)
- [Customization](./docs/customization.md)
- [API reference](./docs/api.md)
- [Comparison](./docs/comparison.md)
- [Examples per adapter](./examples/)
- For LLMs/agents: [`llms.txt`](./llms.txt) · [`llms-full.txt`](./llms-full.txt)

## Status

🚧 **Pre-1.0, under active development.** Building in the open. APIs are stabilizing toward a `v1`. Follow the [roadmap](#roadmap).

## Roadmap

- [x] Headless `@adapttable/core`
- [x] `@adapttable/mantine`
- [x] `@adapttable/i18n` (en/ar + RTL)
- [x] `@adapttable/unstyled` (Tailwind/shadcn)
- [x] `@adapttable/mui`
- [x] `@adapttable/chakra`
- [x] `@adapttable/cli`
- [x] Docs (markdown + `llms.txt`) + examples
- [ ] Hosted docs site + live playground
- [ ] Row virtualization (windowing) for very large lists
- [ ] `v1.0`

## Contributing

PRs welcome! See [CONTRIBUTING.md](./CONTRIBUTING.md). This is a friendly, well-documented codebase with high test coverage — a great place for a first open-source contribution.

## License

[MIT](./LICENSE) © Orwa Mahmoud

---

<div align="center">
<sub>Keywords: react data table, headless table, server-side pagination, url state, infinite scroll table, mantine table, mui datagrid alternative, chakra table, tailwind table, shadcn table, rtl table, arabic table, typescript, dark mode.</sub>
</div>
