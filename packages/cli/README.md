# @adapttable/cli

[![AdaptTable — scaffold a table for any UI kit from one engine](https://orwa-mahmoud.github.io/adapttable/media/core/tour.gif)](https://orwa-mahmoud.github.io/adapttable/demo/)

**[📖 Documentation](https://orwa-mahmoud.github.io/adapttable/)** · **[🚀 Live demo](https://orwa-mahmoud.github.io/adapttable/demo/)** · **[Get started](https://orwa-mahmoud.github.io/adapttable/getting-started/)**

The scaffolding CLI for [AdaptTable](https://github.com/orwa-mahmoud/adapttable).
One command detects your UI kit, picks your package manager, writes a
starter table, and tells you exactly what to install.

```bash
npx @adapttable/cli init
```

```
AdaptTable — detected Mantine.

1. Install the packages:
   pnpm add @adapttable/core @adapttable/mantine @mantine/hooks

2. Scaffolded: src/PeopleTable.tsx

3. Render <PeopleTable /> and you're done.
```

## What it does

- **Detects your UI kit** from `package.json` — Mantine, MUI, Chakra, Ant
  Design, Radix Themes, or Tailwind (→ the unstyled adapter, or shadcn/ui when
  a `components.json` is present), falling back to unstyled.
- **Detects your package manager** from the lockfile (pnpm / yarn / bun /
  npm) and prints the right install command.
- **Scaffolds** `src/PeopleTable.tsx`, a ready-to-render starter using the
  matching adapter. Pass `--force` to overwrite an existing file.

## Programmatic use

The building blocks are exported and pure (easy to test/automate):

```ts
import { detectKit, runInit } from "@adapttable/cli";

detectKit({ "@mui/material": "^6" }).kit; // "mui"
```

## Features

- **Detects your UI kit** from `package.json` — Mantine, MUI, Chakra, Ant Design, Radix,
  Base UI, shadcn/ui (via `components.json`) or Tailwind.
- **Installs the matching adapter** plus any peer packages it needs.
- **Scaffolds a working table** wired to your kit, not a blank file.
- The table it generates supports the full feature set: sorting, filtering, selection,
  row expansion, inline cell editing, row grouping, column management, saved views,
  CSV export, virtualization, pagination and RTL.
- **Programmatic API** — call it from your own scripts, not only the terminal.

## See it work

What `npx @adapttable/cli init` scaffolds, running.

**Row grouping** — group rows by a column with per-group subtotals

![row-grouping](https://orwa-mahmoud.github.io/adapttable/media/core/parts/row-grouping.gif)

**Inline cell editing** — double-click a cell; text, number and select editors

![cell-editing](https://orwa-mahmoud.github.io/adapttable/media/core/parts/cell-editing.gif)

**Filtering** — type a bound and the table answers as you type

![filtering](https://orwa-mahmoud.github.io/adapttable/media/core/parts/filtering.gif)

**Column management** — show, hide, reorder, pin and resize

![column-management](https://orwa-mahmoud.github.io/adapttable/media/core/parts/column-management.gif)

**RTL** — the whole table mirrors, not just the text

![rtl](https://orwa-mahmoud.github.io/adapttable/media/core/parts/rtl.gif)

## Documentation

[Getting started](https://orwa-mahmoud.github.io/adapttable/getting-started/) · [Live demo](https://orwa-mahmoud.github.io/adapttable/demo/) · [Comparison vs ag-Grid · MUI X · TanStack](https://orwa-mahmoud.github.io/adapttable/comparison/)

- **Data** — [client vs server tiers](https://orwa-mahmoud.github.io/adapttable/data-tiers/) · [pagination & infinite scroll](https://orwa-mahmoud.github.io/adapttable/pagination/) · [URL-synced state](https://orwa-mahmoud.github.io/adapttable/url-state/)
- **Interaction** — [filtering](https://orwa-mahmoud.github.io/adapttable/filtering/) · [sorting](https://orwa-mahmoud.github.io/adapttable/sorting/) · [selection & bulk actions](https://orwa-mahmoud.github.io/adapttable/selection/) · [row expansion](https://orwa-mahmoud.github.io/adapttable/row-expansion/) · [inline cell editing](https://orwa-mahmoud.github.io/adapttable/cell-editing/)
- **Columns** — [show/hide · reorder · pin · resize](https://orwa-mahmoud.github.io/adapttable/column-management/) · [row grouping & aggregates](https://orwa-mahmoud.github.io/adapttable/row-grouping/) · [CSV export](https://orwa-mahmoud.github.io/adapttable/customization/#csv-export)
- **More** — [i18n & RTL](https://orwa-mahmoud.github.io/adapttable/i18n-rtl/) · [virtualization](https://orwa-mahmoud.github.io/adapttable/virtualization/) · [customization](https://orwa-mahmoud.github.io/adapttable/customization/) · [API](https://orwa-mahmoud.github.io/adapttable/api/) · [FAQ](https://orwa-mahmoud.github.io/adapttable/faq/)

## License

[MIT](../../LICENSE) © Orwa Mahmoud
