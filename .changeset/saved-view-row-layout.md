---
"@adapttable/core": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
---

A saved view's row keeps its controls together in a narrow panel. The chrome
owns the row's layout and every kit spreads it, so the name never runs into its
read-only badge, and Apply / Rename / ↑ / ↓ / Set as default / Delete wrap as
one group under the name instead of being truncated to "Set a" or spilling into
the next view's row.

Two part names come with it — `saved-view-caption` around the name and its
badges, `saved-view-controls` around the buttons — on the same elements in
every kit.
