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

A save the reader can see, and an undo when it fails

Return a promise from `onCellEdit` and the cell says it is saving until that
promise settles (`data-save="saving"`, `aria-busy`), then says why if it rejects —
in a live region beside it, so a failure is heard as well as seen.

`onEditRollback` puts the row back: a table that showed the new value before the
server agreed has to restore the old one when it disagrees, and only the host can
write to its own rows. The failed cell then offers an Undo (`labels.undoEdit`,
localized in all seventeen locales); without the handler the message shows
without one, which is right for a table that refetches instead.
`formatEditError` words the failure.

A newer save supersedes an older one, so a slow rejection can never mark a value
the reader has already replaced. A host that saves synchronously pays nothing.

Headless: `useCellSaveState`, `CellSaveStatus`, `FailedCellSave`; the editable-cell
controller carries `saveStatus`, `saveFailure`, `canRollback`, `rollback` and
`dismissFailure`. The unstyled and shadcn kits add `editCellSaveError` and
`editCellRollback` class hooks.
