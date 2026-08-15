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

User-facing controls no longer ship on `@adapttable/core`. Import `FilterTreeBuilder`, `ChecklistFilter`, `FilterHeaderRow`, `FilterHeaderControl`, `FindBar`, `RowEditActions`, `BatchEditBar`, `TreeToggle`, `TreeCell`, `ColumnGroupToggle`, `GroupMoreButton`, `RowReorderHandle`, `RowReorderButtons`, `FillHandle`, and `SelectionStatsBar` from the adapter you use. The filter-tree disclosure is adapter-owned too. Core keeps the headless hooks, state machines, and `*Chrome` slot layouts on `@adapttable/core/adapter`. Days-old public exports, no v3.

Adapter-generated filter forms now use their kit-native select, multiselect, disclosure, and popover controls. Long filter overlays remain viewport-bound and scroll internally, including nested kit menus.
