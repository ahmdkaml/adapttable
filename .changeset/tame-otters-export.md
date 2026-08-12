---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/unstyled": patch
---

Spreadsheet export and a range scope. `import { xlsxWriter } from
"@adapttable/core/xlsx"` and pass it as `exportCsv={{ writer: xlsxWriter() }}`
to download a real `.xlsx`: numbers and booleans stay typed so a spreadsheet can
sum them, text that looks numeric stays text so a postal code of `01730` is not
`1730`, and no dependency is added. It is a separate entry point, so a table
exporting CSV ships none of it.

`scope: "range"` exports the highlighted cell rectangle from `cellNavigation`.
The rectangle names its own columns, and with nothing selected the current page
is exported instead.

Every scope works with every format: rows and columns are resolved once, and a
writer turns the result into bytes. `csvWriter`, `buildExportTable`,
`matrixToCsv` and `downloadExportFile` are the pieces, `ExportWriter` the type
to implement for a format of your own, and a backend `request` now receives
`format` alongside the query.
