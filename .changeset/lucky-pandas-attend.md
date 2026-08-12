---
"@adapttable/core": minor
---

Row patches: `applyRowPatches` with `insertRow`, `updateRow`, `upsertRow` and
`removeRow` apply changes to the rows you already hold, so a save or a pushed
update does not need a refetch. Untouched rows keep their object identity, and
a patch that changes nothing returns the very same array — so per-row memos
stay valid, selection and expansion survive, and a no-op does not re-render.
