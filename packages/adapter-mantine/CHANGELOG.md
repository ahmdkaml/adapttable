# @adapttable/mantine

## 0.2.2

### Patch Changes

- 0fe5eca: Ship the **React Compiler**. The published packages are now built with `babel-plugin-react-compiler` (target 18, **production build only** — not the test build), so components and hooks are auto-memoized for fewer wasted re-renders. Tests still run against un-compiled source, so coverage is unaffected; the compiled output adds `react-compiler-runtime` as a small runtime dependency.
- Updated dependencies [0fe5eca]
  - @adapttable/core@0.2.2

## 0.2.1

### Patch Changes

- dd60cf0: docs: each package readme now links the docs site, live demo, and getting-started guide (top links + a Documentation section deep-linking each feature), the `homepage` field points at the docs site, and the root readme gains npm badges. Tailwind/shadcn is reframed as the unstyled adapter path rather than a batteries-included styled adapter.
- Updated dependencies [dd60cf0]
  - @adapttable/core@0.2.1

## 0.2.0

### Minor Changes

- 83610ec: Support React 19 and the latest major of every UI kit.

  - **core / unstyled**: hook and chrome ref types follow React 19's
    `useRef<T>(null) → RefObject<T | null>` change, and the deprecated
    `MutableRefObject` is replaced with `RefObject`. The prop-getters
    (`getTableProps`, `getHeaderCellProps`, `getSortButtonProps`,
    `getCellProps`, `getSearchInputProps`) now return precise element-prop
    interfaces instead of a bare `Record<string, unknown>`, so adapters spread
    them without unsafe casts. React peer stays `^18 || ^19`.
  - **mantine**: adds `@mantine/core` / `@mantine/hooks` `^9` to the peer range
    (now `^7 || ^8 || ^9`); Mantine 9 requires React 19.
  - **mui**: adds `@mui/material` `^8 || ^9` to the peer range. System props
    that v7 removed from `Stack` / `Box` / `Typography` (`alignItems`, `py`,
    `fontWeight`, …) moved into `sx`, which is backward-compatible to v5.
  - **chakra**: rebuilt for Chakra UI **v3** — compound components
    (`Table.Root`, `Menu.Root`, `Popover.Root`, `Drawer.Root`, …),
    `ChakraProvider value={defaultSystem}`, and the v3 prop renames
    (`colorScheme → colorPalette`, `isOpen → open`, …). Peer is now
    `@chakra-ui/react@^3`; Chakra v2 is no longer supported.
  - **antd**: rebuilt for Ant Design **v6** — `Alert` `message → title`,
    `Drawer` `width → size`, `Popover` `styles.body → styles.content`, `Space`
    `direction → orientation`, `Tag` `bordered={false} → variant="filled"`, and
    the logical fixed-column class names. Peer is now `antd@^6`; Ant Design v5 is
    no longer supported.

### Patch Changes

- Updated dependencies [83610ec]
  - @adapttable/core@0.2.0

## 0.1.1

### Patch Changes

- 4584081: Three fixes surfaced by the new demo pages:
  - **core**: in infinite mode, the window growing at the bottom (the
    sentinel incrementing the page) no longer triggers the scroll-to-top
    reset — only real paged navigation does. Reaching the end of a long
    virtualized list no longer teleports the reader back to the top.
  - **mantine**: `stickyHeader` now actually pins in page-scroll mode —
    Chromium cannot stick a `th` inside a `border-collapse: collapse`
    table (Mantine's default), so the sticky header switches the table to
    separate borders (visually identical).
  - **unstyled**: the chips clear-all button rendered as a bare `<li>` —
    an unstylable stray list bullet. It now carries the same `chip`
    part/class as its siblings, so consumer styling applies.

- Updated dependencies [4584081]
  - @adapttable/core@0.1.1

## 0.1.0

### Minor Changes

- 845ff41: Initial public release of AdaptTable — a headless, UI-agnostic React data
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

### Patch Changes

- Updated dependencies [845ff41]
  - @adapttable/core@0.1.0
