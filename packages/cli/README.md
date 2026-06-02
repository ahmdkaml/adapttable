# @adapttable/cli

The scaffolding CLI for [AdaptTable](https://github.com/orwa-mahmoud/adapttable).
One command detects your UI kit, picks your package manager, writes a
starter table, and tells you exactly what to install.

```bash
npx adapttable init
```

```
AdaptTable — detected Mantine.

1. Install the packages:
   pnpm add @adapttable/core @adapttable/mantine @mantine/hooks

2. Scaffolded: src/PeopleTable.tsx

3. Render <PeopleTable /> and you're done.
```

## What it does

- **Detects your UI kit** from `package.json` — Mantine, MUI, Chakra, or
  Tailwind (→ the unstyled adapter), falling back to unstyled.
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

## License

[MIT](../../LICENSE) © Orwa Mahmoud
