---
"@adapttable/core": minor
---

Export scopes, per-column export values, and export lifecycle hooks.

`exportCsv` now chooses its rows with `scope` (`"page"`, `"all"`, or
`"selected"` — ticked rows are found across pages, not just the visible one)
and its fields with `columns` (`"visible"`, `"all"`, or an explicit key list in
file order).

A column can give the file a different value than the screen through
`exportValue`, so a cell reading `"$1,240.00"` exports the number a spreadsheet
can actually sum.

`onBeforeExport` runs once the rows and columns are resolved and before
anything is written — return `false` to cancel or `{ filename }` to name the
file from the data — and `onAfterExport` receives the text that was written.

Defaults are unchanged: without any of these, the button produces exactly the
file it did before.
