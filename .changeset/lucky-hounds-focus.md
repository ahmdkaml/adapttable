---
"@adapttable/core": minor
"@adapttable/antd": minor
"@adapttable/base-ui": minor
"@adapttable/chakra": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/radix": minor
"@adapttable/shadcn": minor
"@adapttable/unstyled": minor
"@adapttable/i18n": minor
---

Keyboard cell navigation. Set `cellNavigation` and the table becomes one tab
stop whose interior is reachable by arrow keys, Home/End, Ctrl+Home/End and
PageUp/PageDown, with `role="grid"` and a live region announcing the column, the
cell's text and the absolute position.

The ARIA indices are dataset-absolute, so a virtualized table rendering 24 rows
of 100,000 reports row 40,002 rather than row 3 of 24 — and Ctrl+End reaches a
cell the virtualizer has not mounted by scrolling it into existence first.

Edges stop rather than wrap, the arrows swap under RTL, and Enter/F2 open the
editor through the existing editing gate. The position phrase is localizable via
`labels.gridCellPosition` and ships translated in all seventeen locales.

Off means absent: with the prop omitted there is no role change, no `tabIndex`,
no key handler and no live region — asserted as byte-identical markup in every
adapter.
