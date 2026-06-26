# @adapttable/radix

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
