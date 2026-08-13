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
"@adapttable/i18n": patch
---

Row pinning via sticky top and bottom sections

`pinnedRowIds` / `onPinnedRowIdsChange` take `{ top, bottom }` id lists.
Pinned rows leave the virtual window and stick above or below the scroll
box; column pins still apply. Grouping and trees refuse it with a
`devWarn`. Mobile cards get the actions and no sticky chrome. The lists
round-trip in the URL (`rowPin`) and in saved views.
