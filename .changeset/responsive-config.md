---
"@adapttable/core": minor
---

Two knobs for the width between a desktop table and a phone.

`mobileBreakpoint` sets the width at which the cards take over, so a table in a
sidebar or a split pane can switch on its own width rather than the window's.

`responsivePriority` on a column says how readily it is given up when the table
is too narrow for all of them — priority 1 is kept longest, and a column that
omits it is never dropped, so the columns carrying the row's identity stay by
saying nothing. The budget is arithmetic on declared widths, so it settles in
one pass instead of the measure-drop-remeasure loop that makes other tables
flicker. A dropped column never reaches the layout state, the URL or a saved
view.
