---
"@adapttable/core": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/unstyled": minor
"@adapttable/i18n": minor
"@adapttable/cli": minor
---

Initial public release of AdaptTable — a headless, UI-agnostic React data
table.

- `@adapttable/core`: headless engine — the `TableSource` contract,
  `useFrontendData` / `useBackendData`, URL-synced state with an injectable
  adapter, `useDataTable` prop-getters, selection, filter chips, sorting,
  pagination, true infinite scroll (`useInfiniteScroll` — an
  IntersectionObserver sentinel that auto-loads the next page), and
  dark-mode resolution.
- Batteries-included adapters for **Mantine**, **MUI**, **Chakra**, and
  **Tailwind/shadcn** (`@adapttable/unstyled`).
- `@adapttable/i18n`: English + Arabic label presets and RTL helpers.
- `@adapttable/cli`: `npx adapttable init` to detect your kit and scaffold.

Highlights: one API for client and server data, shareable URL state,
infinite scroll **and** paging (auto by device), first-class RTL, seamless
dark mode, and a full headless escape hatch.
