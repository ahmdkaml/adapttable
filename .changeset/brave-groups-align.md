---
"@adapttable/core": minor
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

A per-group subtotal now renders in its own column's cell, so it sits under the
column it totals and inherits that column's alignment. It used to share one
spanning cell with the group label and settle at the row's end — on a table wide
enough to scroll, past the right edge of what the user could see.

Mobile cards show the same numbers captioned by their column, since a card has
no columns to align to.

`groupRowLayout` and `groupAggregateEntries` place them, for a custom group
header that should match.
