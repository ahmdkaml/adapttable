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

Edit conflict handling under live updates

A row that changes under an open editor is a conflict, not a discard.
`onEditConflict` and `editConflictPolicy` (`keep` / `take` / `ask`, default
`ask`) decide; `"ask"` surfaces Keep mine / Take theirs on the validation
channel (`data-conflict`). `rowVersion` treats any version change as a
conflict. The same notice appears on a mobile card.
