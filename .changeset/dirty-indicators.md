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

Dirty marks on changes nobody has confirmed

`dirtyIndicators` marks a changed cell with `data-dirty` until its value settles,
and marks its row too so a long table can be scanned without hunting for the cell
inside it.

A mark clears when the save resolves, and stays when it fails — the value is
still at risk until the reader undoes it or tries again. A rollback clears it,
since the value it belonged to is gone. Nothing clears on a timer.

Off by default: a mark is a claim about what the server has agreed to. A host
that settles its own state another way can call `confirm`, `confirmRow` or
`confirmAll` on `table.editing?.dirty`, which also carries a `count` for an
"unsaved changes" line.

Headless: `useDirtyCells`, `DirtyCellState`, and `rowIsDirty(editing, rowId)`
from `@adapttable/core/adapter`.
