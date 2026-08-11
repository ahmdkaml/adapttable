---
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/radix": minor
"@adapttable/base-ui": minor
"@adapttable/antd": minor
"@adapttable/unstyled": minor
---

A new `slots.noResults` replaces the empty state shown when a search or filter
matched nothing, separately from `slots.empty`. Setting only `empty` still
covers both states, so nothing changes until you use it — reach for `noResults`
when the filtered case needs its own message and its own way back to the full
list.

The sticky header's surface and hairline read from `--adapttable-surface` and
`--adapttable-header-border`, so a panel whose background is not the page
background can set them in CSS rather than overriding inline styles (Mantine).
