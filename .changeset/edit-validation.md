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

Validation that gates a commit

A column's `validate(value, row)` judges one value; the table's `validateRow(row)`
judges the row an edit would produce and answers what no single cell can — an end
date before its start, a total that must match its parts. Return a message to
reject, a map of column key → message to mark individual cells, or nothing to
allow it.

A rejected value never reaches `onCellEdit`. The editor stays open holding what
the reader typed, and the message is announced rather than only painted: Mantine
and MUI show it in their own input's error slot, every other kit renders
`data-adapttable-part="edit-cell-error"` with `role="alert"` and points the
editor's `aria-describedby` at it. Escape clears it with the draft.

Both levels may be async — "is this SKU real" is a request. The editor carries
`aria-busy` while a check runs, and a newer draft supersedes an older check so a
stale answer can never mark a value the reader has already changed. A column with
no validator commits synchronously, exactly as before.

Headless: `useEditValidation`, `CellValidator` / `RowValidator`,
`resolveCommitValue`, and `editorValidationProps` / `editorBusyProps` from
`@adapttable/core/adapter`. The unstyled and shadcn kits add an `editCellError`
class hook.
