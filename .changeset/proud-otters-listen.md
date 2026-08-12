---
"@adapttable/core": minor
---

`ColumnDef.formatValue` and `columnText(column, row)` give a cell as plain text
for the contexts that cannot render JSX — screen-reader announcements,
`aria-label`, tooltips, the clipboard. `accessor` returns a `ReactNode`, so a
badge or an avatar cell had no readable form at all.

Text is always available: it resolves `formatValue` → `exportValue` →
`sortValue` → `accessor` when that yields a primitive → the key's data path. A
column that renders its own cell never falls back to the data path, because a
column with `accessor: () => null` shows an empty cell and announcing its
underlying value would name something the user cannot see.
