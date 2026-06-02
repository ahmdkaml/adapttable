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

Edit [src/App.tsx](src/App.tsx) to try different data, columns, row/bulk
actions, or filters. To demo a different adapter, swap the import
(`@adapttable/mui`, `@adapttable/chakra`, `@adapttable/antd`,
`@adapttable/unstyled`) and its provider — every alias is already wired in
[vite.config.ts](vite.config.ts).

Not published, but still lint- and typecheck-gated like every other
workspace package.
