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

Find in table

`findInTable` puts a find bar over the table on Ctrl/Cmd+F. It leaves every row
where it is and walks the cells whose text contains the query — Enter forward,
Shift+Enter back, Escape to close — marking each hit and taking focus to the one
you are on, so the cell is scrolled into view, announced and selected.

Matching reads what a cell shows, so a formatted date is found by its formatted
text, and only the loaded rows are searched: a hit the table cannot take you to
would be a lie. Hits are painted in the amber browsers use for their own find,
overridable through `--adapttable-find-match` (or the `cellMatch` /
`cellMatchCurrent` class hooks in `@adapttable/unstyled`, which the shadcn preset
fills in).

Every word is localizable in all seventeen locales. Headless: `findMatches`,
`useFindInTable` and `FindBar` from `@adapttable/core/adapter`.
