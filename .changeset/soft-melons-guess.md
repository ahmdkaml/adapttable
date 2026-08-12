---
"@adapttable/core": minor
---

Per-column `parseValue` turns an edited draft into the value committed to
`onCellEdit`, so a currency column can display `"$1,240.00"`, seed its editor
with `"1240"`, and commit the number `1240`. It receives the draft as typed
plus the row, and replaces the editor's built-in parsing rather than layering
on it. Columns without one behave exactly as before.
