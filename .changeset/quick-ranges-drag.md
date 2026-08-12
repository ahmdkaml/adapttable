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

Range selection reaches the pointer and whole columns. Drag across cells to
select a block; click a column header to select that column — Ctrl/Cmd+click
where the header already sorts, so sorting keeps the click it has always had.
A column selection covers the loaded rows only, never rows the browser has not
seen.

The selection is also spoken: `labels.gridRangeSelection` announces the
rectangle's edges and size when it changes, translated in all seventeen locales,
and stays quiet for a single cell.
