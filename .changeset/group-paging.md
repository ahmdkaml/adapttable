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

Page the groups, and the rows inside them

`groupPageSize` shows a screenful of top-level groups and offers the rest;
`groupRowPageSize` does the same for the rows inside each group. Each limit adds
one row — "Show 42 more groups", "Show 8 more in this group" — that reveals the
next page when clicked.

Only the top level pages: a nested level is already inside a group the reader
opened. On a server tier, where the rest of a group is not in the browser yet,
`onGroupLoadMore(groupKey)` fires with the group that needs filling.

Localized in all seventeen locales, with `group-more-row` / `group-more-cell` /
`group-more` parts and `groupMoreRow` / `groupMoreCell` class hooks in
`@adapttable/unstyled`.
