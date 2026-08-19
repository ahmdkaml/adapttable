---
"@adapttable/core": patch
---

`getCellSpan` now receives the rows in this tbody (`sectionRows` /
`sectionRowIndex`) so a consecutive merge can restart after a pin. A pin
section and the scroll body still do not share one span.
