---
"@adapttable/core": minor
"@adapttable/unstyled": minor
"@adapttable/mui": minor
"@adapttable/mantine": minor
"@adapttable/chakra": minor
"@adapttable/antd": minor
"@adapttable/radix": minor
"@adapttable/base-ui": minor
"@adapttable/shadcn": minor
---

User-clickable controls no longer ship on `@adapttable/core`. Import `FilterTreeBuilder`, `ChecklistFilter`, `FilterHeaderRow`, `FilterHeaderControl`, `FindBar`, `RowEditActions`, `BatchEditBar`, `TreeToggle`, `TreeCell`, `ColumnGroupToggle`, `GroupMoreButton`, `RowReorderHandle`, and `RowReorderButtons` from the adapter you use. Core keeps the headless hooks, state machines, and `*Chrome` slot layouts on `@adapttable/core/adapter`. Days-old public exports, no v3.
