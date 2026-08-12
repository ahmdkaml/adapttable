---
"@adapttable/core": minor
---

`aggregate()` builds a `summaryRow` or `groupAggregates` mapper from a
declaration instead of a hand-written function: `aggregate({ budget: "sum" })`.
Built in are `sum`, `avg`, `count`, `min` and `max`, and any function of your
own is accepted for the rest.

Values resolve through a column's `sortValue` when columns are passed, so a
formatted cell still aggregates on its underlying number. Missing values are
skipped rather than counted as zero, and while a sum of nothing is `0`, an
average of nothing is `undefined`.

The mapper props are unchanged and still take a plain function.
