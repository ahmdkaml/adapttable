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

Row reordering via a reserved drag-handle column

`onRowReorder(from, to, row)` is the write — dataset-relative indices, never
a mutate (`applyRowReorder` for in-memory hosts). Keyboard is a grab: Space
lifts, arrows move, Space drops, Escape cancels, each step announced.
Grouping and trees refuse it with a `devWarn`. Mobile cards get up/down
buttons. The column hides and start-pins from the Columns menu
(`REORDER_COLUMN_KEY`).
