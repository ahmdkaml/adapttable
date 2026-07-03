---
"@adapttable/core": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/antd": minor
"@adapttable/radix": minor
"@adapttable/shadcn": minor
"@adapttable/unstyled": minor
---

Bring the whole adapter set to feature parity.

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
