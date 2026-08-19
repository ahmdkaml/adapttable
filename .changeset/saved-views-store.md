---
"@adapttable/core": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Saved views can live on a server: pass `useSavedViews` a `store` and it replaces
`localStorage`, which stays the zero-config default.

Views gain `visibility` (`"private"` or `"team"`) and `readOnly`. A shared view
someone else owns is visibly read-only in every adapter — a Read-only badge with
its rename, reorder, set-default and delete controls disabled — and the hook
refuses those operations too, so the UI and the state agree. Applying it stays
enabled, which is the point of a shared view.

The store is asked for one view at a time rather than the whole list, so a save
cannot overwrite what someone else changed in the meantime, and a store that
cannot be reached leaves the list empty instead of throwing into a render.
