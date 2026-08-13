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

Row and column spanning via a per-row cell list

`getCellSpan` and `column.colSpan` / `column.rowSpan` emit one cell list
per row; covered cells are omitted. Arrow keys skip them, CSV writes the
origin once. Mobile cards ignore geometry. Nothing goes in the URL.
