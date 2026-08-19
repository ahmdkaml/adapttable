---
"@adapttable/antd": patch
---

Pinning a row no longer paints it over the next people when a cell span is in
the same body. antd owns one tbody, so sticky pin chrome is skipped while a
`rowSpan` is present; the row still moves to the top or floor.
