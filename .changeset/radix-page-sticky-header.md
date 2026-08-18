---
"@adapttable/radix": patch
---

Page-scroll sticky headers on the Radix adapter stay under the toolbar instead of dropping into the first rows. `Table.Root`'s ScrollArea was trapping `position: sticky` in its own box.
