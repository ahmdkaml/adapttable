---
"@adapttable/core": minor
---

Order and filter groups

`groupSort` orders groups within their parent — `"label"`, `"label-desc"`,
`"count"`, `"count-desc"`, or a comparator over `{ value, label, level,
groupBy, leafRows }`. To sort by an aggregate, compare the leaves the aggregate
is computed from; comparing rendered aggregate cells would mean comparing
ReactNodes, which is not an ordering.

`groupFilter` keeps only the groups it answers true for, at every level, and a
dropped group takes its leaves with it — so the counts and totals that remain
describe what is on screen.

Both apply to every level of a nested group. The pipeline is documented: row
filters, then grouping, then `groupFilter`, then `groupSort`, with leaf order
inside a group always the source's own.
