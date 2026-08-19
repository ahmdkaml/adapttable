---
"@adapttable/core": patch
---

`getCellSpan` receives the visual body order (`sectionRows` /
`sectionRowIndex`) — pinned top, then scroll, then pinned bottom — so a
consecutive merge stays one cell when a teammate is pinned.
