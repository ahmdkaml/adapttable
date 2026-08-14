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

Nested row grouping

`groupBy` takes an ordered list — `groupBy={["team", "status"]}` — and each key
nests inside the one before it. Every header describes its whole subtree: the
count beside a team is all of its people, and `groupAggregates` totals the same
set. Deeper levels indent by logical padding, so nesting mirrors in RTL.

Each node collapses on its own, because a node's key carries its whole path:
"Core > blocked" and "Platform > blocked" are different groups, and closing a
parent hides its subtree in one step.

The keys travel as one comma-separated value (`?groupBy=team,status`), so links
and saved views built for a single key keep working; `onGroupByChange` now
reports the keys as a list.

Headless: `parseGroupBy`, `formatGroupBy`, and `groupIndentStyle` from
`@adapttable/core/adapter`.
