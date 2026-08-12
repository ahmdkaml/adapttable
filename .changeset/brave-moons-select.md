---
"@adapttable/core": minor
---

Cell range selection. Hold Shift with any movement key, or shift-click a cell,
and the selection extends from where it began; a plain move collapses it back to
one cell.

A range is two corners — the anchor where it started and the head where it
reaches — not a list of cells. That is why Shift+Down twice then Shift+Up
shrinks the range rather than starting a new one upward, and why a 50,000-cell
selection costs two numbers.

Selected cells carry `data-cell-selected` for styling, and `aria-selected` only
once a real rectangle exists — marking every focused cell as selected would tell
a screen reader the table is in selection mode when the user has merely arrowed
around. `onRangeChange` reports every change and `gridFocus.range` holds the
current rectangle.
