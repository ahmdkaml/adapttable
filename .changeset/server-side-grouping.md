---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Grouping on the server

A source that declares `supports: { grouping: true }` now receives the grouping
keys with every query — as an array, outermost first — and, with
`supports: { aggregates: true }`, the `aggregates` it was asked for. Return
`groups` on the source and the table renders them exactly as it renders local
groups: same headers, collapsing, footers and selection.

The counts and aggregates displayed are the server's, so a group of 4,000 whose
response carried 20 rows says 4,000. A server can send counts only and fill each
group's rows in when it opens.

The response shape and a reference endpoint are documented in
[row grouping](https://adapttable.dev/docs/row-grouping). Headless:
`serverGroupEntries`, `QueryGroupRow`, `QueryGroupsPage`, `groupLeafCount`.
