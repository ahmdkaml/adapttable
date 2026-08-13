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

Tree data — hierarchical rows in all nine adapters

Pass `getChildren(row)` for nested data, or `getParentId(row)` for a flat list
with a parent column, and the table renders the hierarchy: one chevron per
parent, one indent step per level, in the first column or the one `treeColumn`
names. `expandedIds` / `onExpandedIdsChange` hand the open set to the host.
Without either prop the table is the flat list it always was.

This is a separate model from `groupBy`, deliberately: a group is derived from
values and regroups when the reader changes the question, a tree is declared by
the data and holds its shape through a sort.

Mobile cards keep the hierarchy — each card steps in by its depth and carries
the same chevron. A tree windows through the same virtualizer a grouped model
does, so 50,000 hierarchical rows render about 20 of them; the benchmark suite
records the scenario.

Headless: `buildTreeEntries`, `useTreeExpansion`, `filterTreeRows`,
`treeColumnKey`, `treeIndentStyle`, `treeCardStyle`, `bodyRowEntries`, and
`TreeCell` / `TreeToggle` from `@adapttable/core/adapter`. The unstyled and
shadcn kits add `treeCell`, `treeToggle` and `treeSpacer` class hooks.
