---
"@adapttable/core": minor
---

`useHighlight` marks a row or a cell for a moment — the "flash the row I just
saved" that otherwise gets written as a `setTimeout` in every host.

It composes with `rowClassName` rather than adding a prop, so it works in every
adapter without one of them being touched, and the highlight looks like your
design system rather than ours.

Marks are keyed by row id, so one survives the sort, filter or page change that
moves the row. Under `prefers-reduced-motion` the mark still appears and still
clears — `animated` goes false and it holds steady, and longer, because a steady
mark is easier to miss than one that moves. Reduced motion means less movement,
not less feedback.
