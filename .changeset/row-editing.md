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

Row editing: one commit for the whole row

`rowEditing` + `onRowEdit` change the commit unit from a cell to a row. Every
editable field of a row opens together, holds its draft, and reaches the host as
ONE patch of only what changed — the right unit for a row whose fields constrain
each other, which cannot be edited a cell at a time without passing through
states that are invalid on the way.

Each row grows an Edit control; Save hands over the patch, Cancel throws the
drafts away, and Enter and Escape do the same from any field. An untouched row
reports nothing. One row is open at a time. The same editors, the same
`parseValue`, the same per-column `editable` predicate, and the same behaviour on
a mobile card.

`onCellEdit` is not required: a table that only wants row-level commits leaves it
out, and its cells stay display-only until a row is opened.

Labels `editRow` and `saveRow` are translated in all seventeen locales. Parts:
`row-edit-begin`, `row-edit-actions`, `row-edit-save`, `row-edit-cancel`.

Headless: `useRowEditing`, with `RowEditCell`, `RowEditActions` and
`rowEditControls` from `@adapttable/core/adapter`. Every kit's editor now takes
its focus ref from the controller (`ctrl.focusRef`), so the table decides which
field takes focus.
