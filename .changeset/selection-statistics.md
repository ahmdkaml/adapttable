---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/i18n": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Selection statistics

`selectionStats` puts a strip under the table saying what the selected cells
add up to: count, sum, average, min and max. The count covers every selected
cell and the arithmetic covers the numeric ones, so a rectangle spanning a name
and a budget still has a sum. Numbers are read the way an export reads them, so
the total on screen matches the total a spreadsheet computes from the same
cells.

A single cell shows nothing. The strip is a status region, so the figures are
read after the range announcement, and every word is localizable in all
seventeen locales. Number formatting follows the table's `locale`.

Headless: `selectionStats` and `SelectionStatsBar` from
`@adapttable/core/adapter`.
