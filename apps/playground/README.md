# Playground

A local-only dev harness for running AdaptTable against the workspace source —
**no npm publish, no local registry required.** Vite aliases each
`@adapttable/*` import to its TypeScript source, so the library hot-reloads as
you edit it.

```bash
# from the repo root
pnpm install
pnpm --filter @adapttable/playground dev
# open http://localhost:5173
```

Use the switcher at the top to flip between all five adapters — Mantine,
MUI, Chakra, Ant Design, and Unstyled+Tailwind — each rendering the same
headless source. Shared rows and column defs live in [src/data.ts](src/data.ts);
each adapter demo is in [src/adapters/](src/adapters/). Edit those to try
different data, columns, row/bulk actions, or filters.

Not published, but still lint- and typecheck-gated like every other
workspace package.
