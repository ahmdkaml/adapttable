---
"@adapttable/core": minor
"@adapttable/i18n": patch
---

`pivotTableModel(result)` turns a pivot into the props a `DataTable` takes, so
the pivot is rendered by your kit instead of by markup of your own.

The column tree becomes `column.group` — one header row per level, spans
included — every line becomes a row, and the grand total becomes the table's
`summaryRow`, the column-aligned footer it already had. The row-header column
carries the indent and each line's caption; `renderRowHeader` is where a fold
control goes, since core ships no user-facing controls.

Two new labels ride with it, localized in every locale: `pivotTotal` captions
the grand-total column and `pivotGrandTotal` the grand-total line.
