# @adapttable/radix

## 1.2.3

### Patch Changes

- a7e51ba: Depend on sibling packages by caret range instead of an exact pin.

  Adapters declared `workspace:*`, which publishes as an exact version — `@adapttable/mantine@1.2.2` required precisely `@adapttable/core@1.2.2`. Installing an adapter alongside `@adapttable/core` therefore produced **two copies of core**:

  ```
  node_modules/@adapttable/core                                  1.2.2
  node_modules/@adapttable/mantine/node_modules/@adapttable/core 1.2.1
  ```

  Most of core is per-instance state, so a second copy is mainly waste — but the URL-namespace registry is module-level, so two copies means two registries, and two tables that do not set an explicit `urlKey` can claim the same namespace and overwrite each other's URL state.

  The exact pin also forced all eight adapters to republish on every core patch, even when nothing about them changed.

  `workspace:^` publishes as `^1.2.2`: the resolver keeps one copy, and a future core patch releases core alone. This release ships that range into every adapter, which is why all of them are included here — it is the last time a core change requires them.

- Updated dependencies [a7e51ba]
- Updated dependencies [a7e51ba]
  - @adapttable/core@1.2.3

## 1.2.2

### Patch Changes

- feed13d: Fix the broken hero image on every npm package page, and add a clip per feature.

  npm renders README images through GitHub's camo proxy, which refuses anything
  over 5 MB. Every demo GIF was 5.2–8.7 MB, so camo returned `Content length
exceeded` and each package page showed a broken image instead of the table.

  The clips are now cut per feature — row grouping, cell editing, filtering,
  column management and RTL — cropped to the table at native resolution rather
  than downscaling the whole page. Each is 232 KB–2.3 MB, and each is sharper
  than the 8 MB version it replaces, because a shorter clip spends its budget on
  pixels instead of length.

- Updated dependencies [feed13d]
  - @adapttable/core@1.2.2

## 1.2.1

### Patch Changes

- b77bcdc: Point each README's demo image at the live demo instead of a raw `.mp4` file,
  and deep-link it to that package's own adapter (`/demo/?kit=mui`,
  `?kit=radix`, …) now that the kit selector is URL-addressable. Clicking the
  image lands on a table you can actually use rather than a video download.
- a719db6: List inline cell editing and row grouping in each README's feature links. Both
  shipped in 1.2.0 but the package pages never mentioned them, so anyone reading
  on npm had no way to learn they exist.
- b77bcdc: Fix RTL and popover defects found while filming the adapter demos.

  **Radix, right-to-left.** Three separate faults stacked: `dir` never reached
  the `<table>` (it stopped at the outer box), the ScrollArea that `Table.Root`
  wraps the table in writes its own `dir="ltr"` which outranked any inherited
  direction, and `justify` compiles to physical `rt-r-ta-left` / `rt-r-ta-right`
  classes rather than logical `start` / `end`. Under an Arabic locale the labels
  translated but the columns rendered left-to-right, and after the first two
  fixes every header and cell still hugged the left edge. All three are handled
  now; LTR is untouched.

  **Column menu ignored direction (Mantine, MUI, Radix, Base UI).** The menu
  portals to `<body>`, so it loses the table's direction unless it is passed
  explicitly — only Chakra did. Under RTL the grip and pin controls stayed on
  the wrong sides. Every adapter now forwards `dir` to its portalled menu.

  **Filter popover jumped over the trigger (Radix, Base UI).** Choosing the
  "between" operator reveals a second bound input, and the default collision
  handling answered that growth by flipping the whole panel above the trigger,
  covering the page header and the control just clicked. The panel now stays
  anchored below and scrolls if it runs out of room.

  **Ant Design column menu rendered a card inside a card.** The menu repainted
  the elevated surface antd's Popover already provides; only spacing belongs to
  the adapter now.

  **Ant Design mobile cards re-rendered on every keystroke.** Each card compared
  the shared editing bundle, whose identity changes whenever any draft changes,
  so typing in one cell re-rendered every card on screen and the per-row digest
  that exists to prevent exactly that was dead weight. Cards are now memoized on
  their visual inputs plus that digest, matching every other adapter.

- Updated dependencies [b535c41]
- Updated dependencies [b77bcdc]
- Updated dependencies [a719db6]
  - @adapttable/core@1.2.1

## 1.2.0

### Minor Changes

- e36b3ee: Add an opt-in `exportCsv` toolbar button on every adapter. Exports the visible columns in display order for the current page (or the full filtered set with `scope: "all"`). New `exportCsv` label key in core defaults and all i18n locales.
- c402908: Add opt-in inline cell editing. Pass `onCellEdit` to enable; mark columns with `editable` / `editor` / `editValue`. Kit-native text, number, and select editors on every adapter (desktop + mobile). New `editCell` label in core defaults and all i18n locales. Without `onCellEdit`, editing stays fully dormant.
- 4546dcd: Add opt-in single-level row grouping. Pass `groupBy` to group by one column (frontend tier only; server sources devWarn and ignore). Optional `groupAggregates` shares the `summaryRow` mapper signature for per-group subtotals. Expand/collapse group headers on every adapter (desktop + mobile), with tri-state group selection when checkboxes are on. New `expandGroup`, `collapseGroup`, and `groupCount` labels in core defaults and all i18n locales. Without `groupBy`, grouping stays fully dormant.

### Patch Changes

- Updated dependencies [e36b3ee]
- Updated dependencies [c402908]
- Updated dependencies [4546dcd]
  - @adapttable/core@1.2.0

## 1.1.2

### Patch Changes

- e909bf7: Refresh adapter npm README demos: animated GIFs (click through to mp4) replace static posters so npm package pages show motion without leaving the page.
- Updated dependencies [e909bf7]
  - @adapttable/core@1.1.2

## 1.1.1

### Patch Changes

- @adapttable/core@1.1.1

## 1.1.0

### Minor Changes

- 6c7030b: Bring the whole adapter set to feature parity.

  - **Entrance animation on every adapter.** The opt-in `animate` mount stagger —
    a dependency-free row/card entrance that honours `prefers-reduced-motion` —
    now works on MUI, Chakra, Ant Design, Radix, shadcn/ui and unstyled, not just
    Mantine. `useMountStagger` moved into `@adapttable/core`; the existing
    `@adapttable/mantine` import path is unchanged.
  - **Ant Design mobile-card windowing.** antd already virtualized desktop rows
    through its native table; under `virtualize` its mobile card list now windows
    through the shared engine as well, like every other adapter.
  - **Popover keyboard a11y fix (MUI, Chakra, Ant Design).** Pressing Escape in
    the filter popover now hands focus back to the Filters trigger instead of
    stranding keyboard users, matching the Mantine/Radix/unstyled behaviour and
    the documented overlay contract.
  - Docs and README polish: the `ColumnDef` `filter` JSDoc is attached to the
    right field, and each package README gains a "Try in StackBlitz" link (with
    migration guides where a source library exists); the Chakra README now
    correctly targets v3.

### Patch Changes

- Updated dependencies [6c7030b]
  - @adapttable/core@1.1.0

## 1.0.0

### Major Changes

- a94745e: AdaptTable 1.0 — the public API is now stable under semantic versioning.

  This release freezes the committed-stable surface: the `@adapttable/core` engine
  (source builders, `useDataTable` and its prop-getters, the core types, and the
  URL-state hooks), every adapter's `<DataTable>` props and extension points
  (`slots`, `classNames`, `toolbar`, `confirm`), and the `@adapttable/i18n` locale
  presets. From this release on, breaking changes to that surface ship only in a
  major version. There are no runtime behavior changes — this marks the stability
  commitment. `@adapttable/cli` is a scaffolding tool and keeps its own cadence.

### Patch Changes

- ef3c0f3: Render `filtersMode="drawer"` as a real side drawer in the Radix adapter.

  Radix Themes ships no Drawer primitive, so the drawer previously fell back to a
  centered Dialog (a modal). It now pins to the inline-end edge at full height and
  slides in from that edge — RTL-correct via logical insets and honoring
  `prefers-reduced-motion` — while keeping the Dialog's backdrop, focus trap, and
  Escape / outside-click dismissal.

- Updated dependencies [a94745e]
  - @adapttable/core@1.0.0

## 0.3.3

### Patch Changes

- 761be36: Internal de-duplication: hoist the logic the Chakra and Radix adapters shared
  verbatim into `@adapttable/core` — the `<DataTable>` orchestration
  (`useDataTableShell`), the auto-filter range-widget logic, and the sticky
  cell-style / row-memo helpers. Each adapter now renders only its own kit's
  controls over the shared state. No behaviour, markup, or public-API change for
  consumers; core stays headless (zero UI-kit imports).
- Updated dependencies [761be36]
  - @adapttable/core@0.3.3

## 0.3.2

### Patch Changes

- 682d3b7: Road-to-1.0 prep: document the versioning & stability contract, mark the
  `mergeProps`/`Props` prop-getter plumbing as `@internal` (consumers use the
  `useDataTable` prop-getters, not the merge helper), add a `smoke-dist`
  post-build check that asserts every advertised `exports`/`main`/`module`/`types`
  target is actually emitted, and harden `getPath`/`humanizeKey` to tolerate an
  empty/undefined key so a transiently-malformed column key can never crash a
  render. No behaviour changes; no breaking changes.
- Updated dependencies [682d3b7]
  - @adapttable/core@0.3.2

## 0.1.1

### Patch Changes

- 6ab1391: docs: every package README now leads with a click-to-play demo — a poster (with
  a play button) that links to an mp4 of the table in action — replacing the
  autoplaying GIF. Republishing so the new READMEs land on npm.
- Updated dependencies [6ab1391]
  - @adapttable/core@0.3.1

## 0.1.0

### Minor Changes

- a90a2c2: New `@adapttable/radix` adapter — a batteries-included Radix Themes data table on
  the headless `@adapttable/core` engine, with sorting, filtering, URL-synced
  state, selection + bulk actions, numbered pagination, column management
  (show/hide, reorder, pin, resize), RTL, and dark mode. Wrap it in Radix's
  `<Theme>` and pass `accentColor` to tint it.

### Patch Changes

- 07db665: Accessibility: give the filter overlay an accessible name — the Chakra and
  Radix filter popovers and the MUI filter drawer now set `aria-label` on their
  `role="dialog"` wrapper, fixing an `aria-dialog-name` violation. Locked in with
  axe assertions across every adapter's filter overlay (popover + drawer).
- Updated dependencies [a90a2c2]
- Updated dependencies [a90a2c2]
  - @adapttable/core@0.3.0
