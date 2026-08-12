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

Fill handle on the selection's corner

Select cells with `cellNavigation` on and a small square appears on the bottom
corner of the selection. Drag it and the values carry on — down, up or sideways
— with the cells it would write highlighted before anything is committed. Two or
more numbers a constant step apart continue the series; anything else repeats.
Ctrl/Cmd+D fills the selection down from its top row and announces what it
wrote.

The edits arrive through `onCellEdit`, or `onCellFill` for the batch, so the
handle appears as soon as a table can be edited and never when it cannot. All
eight adapters, RTL included.

Headless: `fillDirection`, `fillTargetRange`, `fillRangeEdits`,
`cellFillHandler`, and `FillHandle` from `@adapttable/core/adapter`.
