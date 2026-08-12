---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/i18n": minor
---

Undo and redo for edits

`editHistory` remembers edits so Ctrl/Cmd+Z can take them back, with
Ctrl/Cmd+Shift+Z and Ctrl+Y to put them forward again. One gesture is one entry:
a paste of two hundred cells undoes in a single press, as does a fill.

An undo commits the previous value back through `onCellEdit`, the same call the
original edit made, so validation, mutations and optimistic updates all run on
the way back exactly as they ran on the way out — the table still never writes
to data it does not own. Fifty gestures are kept by default; pass
`{ depth: 200 }` for more, and `table.editHistory` exposes `undo`, `redo`,
`canUndo`, `canRedo` and `clear` for your own buttons.

Announced in all seventeen locales.
