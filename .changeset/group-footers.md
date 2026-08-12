---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/i18n": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Group footers

`groupFooters` closes every group with a row carrying the same aggregates its
header carries, so the totals read at the bottom of a long group as well as the
top. A footer shows no chevron and no checkbox — the header owns both — nested
groups each get their own innermost first, and a collapsed group shows none at
all.

`summaryRow` remains the grand total and, under grouping, totals the whole
filtered set. On mobile the footer is a card of its own; exports are untouched,
since a footer is chrome rather than a row.

Captioned through `labels.groupTotal` in all seventeen locales, with
`group-footer-row` / `group-footer-cell` parts and matching class hooks in
`@adapttable/unstyled`.
