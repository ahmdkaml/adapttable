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

Two behaviours were split across kits and are now uniform: **applying a view
closes the panel** (mantine, chakra, radix and base-ui kept it open), and the
panel no longer repeats the trigger's "Saved views" label as an inner title
(those same four printed it twice). Saving still clears the field and keeps
the panel open, so several views can be captured in one sitting. chakra, radix
and base-ui move to controlled popovers, which is what let their panels ignore
the close.

`@adapttable/unstyled` adds `viewsRow` and `viewsSaveRow` class hooks with
matching `data-adapttable-part` names — its two panel rows carried neither, so
their spacing could not be styled at all — plus a structural gap so they are
not flush with no classes set. In the `@adapttable/shadcn` preset the name
field now takes the row's free space, so the save button no longer overflows
the panel.
