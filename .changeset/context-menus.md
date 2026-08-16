---
"@adapttable/core": minor
"@adapttable/unstyled": minor
"@adapttable/shadcn": minor
---

`contextMenu` arms right-click menus for headers, rows and cells. A header
offers sort, filter, pin and hide; a cell offers copy and cut. Each entry
appears only when the handler behind it is wired and the column allows it, and
`{ items }` appends your own behind a divider.

Every route in works: right-click, Shift+F10 and the menu key for the keyboard,
and a long press for touch. Escape closes and puts focus back where it came
from.

`copyCells` on the grid-focus state copies a given cell, or the selection when
given none — the route a context menu needs and the key handler never did.

Available in `@adapttable/unstyled` and `@adapttable/shadcn`; the themed kits
follow.
