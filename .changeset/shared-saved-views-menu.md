---
"@adapttable/core": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/radix": minor
"@adapttable/base-ui": minor
"@adapttable/unstyled": minor
"@adapttable/shadcn": minor
---

The saved-views menu behaves the same in every adapter.

`@adapttable/core/adapter` gains `useSavedViewsMenu` (the view list, the
pending name, and apply/save/delete) and `SavedViewsMenuContent` (the rows, the
divider, the save row) rendered from a `SavedViewsParts` bundle each kit fills
with its own components. Six adapters now share both; each keeps its own
popover, which already handles portalling and focus return.

Two behaviours were previously split across kits and are now uniform:
**applying a view closes the panel** (mantine, chakra, radix and base-ui kept
it open), and the panel no longer repeats the trigger's "Saved views" label as
an inner title (mantine, chakra, radix and base-ui printed it twice). Saving
still clears the field and keeps the panel open.

`@adapttable/unstyled` adds `viewsRow` and `viewsSaveRow` class hooks with
matching `data-adapttable-part` names — its two panel rows carried neither, so
their spacing could not be styled at all — plus a structural gap so they are
not flush with no classes set. In the `@adapttable/shadcn` preset the name
field now takes the row's free space, so the save button no longer overflows
the panel.
