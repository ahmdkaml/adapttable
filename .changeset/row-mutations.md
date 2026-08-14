---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/i18n": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Add, duplicate and delete rows

Three handlers, three controls. `onAddRow` puts an Add row button in the
toolbar; `onDuplicateRow` and `onDeleteRow` put Duplicate row and Delete row on
every row, after your own `rowActions` so a delete stays last. They ride the
actions column like any other row action — hideable and end-pinnable from the
Columns menu, buttons on desktop and card buttons on mobile.

A delete asks first, through the same confirmation dialog a `rowActions` entry
uses; `confirmDeleteRow={false}` skips it.

The table stores nothing. A row you add arrives through the source like every
other row, so it is editable, filterable, sortable, grouped, counted and
virtualized from the moment it lands.

Labels `addRow`, `duplicateRow`, `deleteRow` and `deleteRowConfirm` are
translated in all seventeen locales. Headless: `useRowMutations`.
