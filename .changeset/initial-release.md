---
"@adapttable/core": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/antd": minor
"@adapttable/unstyled": minor
"@adapttable/i18n": minor
"@adapttable/cli": minor
---

Initial public release of AdaptTable — a headless, UI-agnostic React data
table: one API, rendered natively by your design system.

- `@adapttable/core`: the headless engine — declarative `columns` (bare
  keys, dot-paths, auto headers) and `filters` (one definition drives the
  widget, URL params, chips, and predicate, with `"auto"` and async option
  sources), three data tiers (in-memory, server via one consolidated
  `onQueryChange(query, { signal })`, or a full custom `TableSource`),
  URL-synced state with an injectable adapter (`urlSync={false}` for
  in-memory), multi-sort, summary rows, header groups, row expansion,
  saved views, select-all-N-matching, keyboard row navigation, and opt-in
  row/card virtualization that tracks the page or any `maxHeight` scroll
  box — 50,000 rows stay a handful of DOM nodes.
- Batteries-included adapters for **Mantine**, **MUI**, **Chakra UI**,
  **Ant Design**, and **Tailwind/shadcn** (`@adapttable/unstyled`): native
  filter forms with operator-first number/date ranges, column management
  (hide / reorder / pin / resize — the row-actions column included), a
  built-in saved-views menu, mobile card layouts, and memoized rows.
- `@adapttable/i18n`: label presets for ten locales (en, ar, de, es, fr,
  he, it, ja, pt, zh) with RTL helpers — headers, cells, sorting and
  filtering can all follow per-locale data paths.
- `@adapttable/cli`: `npx @adapttable/cli init` detects your kit and
  scaffolds a working table.

Highlights: shareable URL state, paging and true infinite scroll (auto by
device), first-class RTL, seamless dark mode, 100% test coverage, and a
full headless escape hatch at every layer.
