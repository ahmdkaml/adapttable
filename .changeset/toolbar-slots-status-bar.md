---
"@adapttable/core": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
"@adapttable/shadcn": patch
"@adapttable/i18n": patch
---

Three pieces of optional chrome, each off unless asked for.

`toolbarSlots` puts a host's own controls at either end of the toolbar —
`{ start, end }` — where `toolbar` has always filled the middle.

`undoRedoButtons` shows Undo and Redo in the toolbar. The buttons render only
when `editHistory` is armed and disable rather than disappear, so the toolbar
does not reflow as someone works. The shortcuts and `table.editHistory` are
unchanged.

`statusBar` shows a strip under the table: the row range, how many rows are
selected, and what a multi-cell selection adds up to. It reads the same range
as the pagination footer and hosts the selection statistics rather than
repeating them.

New label `redoEdit`, translated in all 17 locales.
