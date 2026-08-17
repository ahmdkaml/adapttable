---
"@adapttable/core": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

Body-row props come from one place. `getRowProps` emits
`data-adapttable-part="row"`, so MUI, Mantine, Chakra, Radix and Base UI take
the row part, `role`, `data-row-id`, `data-index` and `aria-selected` from core
in a single spread. Rows in those kits carry the dataset index of the row they
render — pinned and windowed rows included — and say `aria-selected` while bulk
selection is armed.
