# @adapttable/base-ui

## 1.3.0

### Minor Changes

- e36b3ee: Add an opt-in `exportCsv` toolbar button on every adapter. Exports the visible columns in display order for the current page (or the full filtered set with `scope: "all"`). New `exportCsv` label key in core defaults and all i18n locales.
- c402908: Add opt-in inline cell editing. Pass `onCellEdit` to enable; mark columns with `editable` / `editor` / `editValue`. Kit-native text, number, and select editors on every adapter (desktop + mobile). New `editCell` label in core defaults and all i18n locales. Without `onCellEdit`, editing stays fully dormant.
- 4546dcd: Add opt-in single-level row grouping. Pass `groupBy` to group by one column (frontend tier only; server sources devWarn and ignore). Optional `groupAggregates` shares the `summaryRow` mapper signature for per-group subtotals. Expand/collapse group headers on every adapter (desktop + mobile), with tri-state group selection when checkboxes are on. New `expandGroup`, `collapseGroup`, and `groupCount` labels in core defaults and all i18n locales. Without `groupBy`, grouping stays fully dormant.

### Patch Changes

- Updated dependencies [e36b3ee]
- Updated dependencies [c402908]
- Updated dependencies [4546dcd]
  - @adapttable/core@1.2.0

## 1.2.1

### Patch Changes

- e909bf7: Refresh adapter npm README demos: animated GIFs (click through to mp4) replace static posters so npm package pages show motion without leaving the page.
- e909bf7: Fix portaled Filters/Columns/Drawer chrome: CSS tokens now apply on portal surfaces so overlays stay opaque above sticky headers, and multi-select chips / selects / drawer title render as real controls.

  Put overlay z-index tokens on Base UI **positioners** too — `transform` on the positioner is the stacking context, so z-index on the inner popup alone still lost to sticky table headers.

  Render multi-select filter options as label-only chips (no nested checkbox boxes).

- Updated dependencies [e909bf7]
  - @adapttable/core@1.1.2

## 1.2.0

### Minor Changes

- ba0d42b: Add `@adapttable/base-ui` — a batteries-included Base UI (`@base-ui/react`) adapter with the same DataTable API as the other kits. The CLI detects `@base-ui/react` and scaffolds this adapter.
