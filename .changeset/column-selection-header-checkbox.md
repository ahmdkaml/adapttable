---
"@adapttable/core": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
"@adapttable/shadcn": patch
"@adapttable/i18n": patch
---

`columnSelectionCheckbox` puts a checkbox in every column header that selects
that column. Ctrl/Cmd+click on a header still does what it always did; this is
the same selection reached two ways it cannot be — by a finger, which has no
modifier key to hold, and by a screen reader, which cannot discover a gesture
nothing announces. It needs `cellNavigation` for a selection to exist, so either
prop alone renders nothing.

The name is `labels.selectColumn` plus the column's own name, translated in all
seventeen locales. The control is each kit's own checkbox in core's
`ColumnSelectCheckboxChrome`, which owns the layout, the accessible name and
keeping the click off the header underneath — otherwise the same click would
sort the column it just selected. It carries
`data-adapttable-part="column-select"` and the `columnSelect` classNames key.

Where the pointer can hover, the box holds its space and fades in on hover or
focus, so a wide header row is not a row of checkboxes; a selected column keeps
its box visible. Where there is no hover, it is always visible.

`GridFocusState` gains `columnCheckbox`, `isColumnSelected(col)` and
`toggleColumn(col)`.
