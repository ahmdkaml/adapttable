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

Editing lifecycle events

`onEditStart`, `onEditCancel`, `onEditCommit`, `onValidationFail` and
`onEditError` observe a cell, row or batch edit. They cannot change the
outcome — a throw is swallowed — so analytics and toasts never rewind a
commit. The shared payload is `EditEvent`: row, rowId, columnKey, value,
previousValue, unit, and optional error. The same events fire on a mobile
card. Headless: `useCellEditing` accepts `UseCellEditingOptions` for start
and cancel.
