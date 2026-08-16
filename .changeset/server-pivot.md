---
"@adapttable/core": minor
---

`serverPivotResult` — render a pivot the server computed.

A translator rather than a second engine: the server decides the arithmetic and
the ordering, core rebuilds the column tree and the leaf ordering from the paths
it named, and the result is the same `PivotResult` the local engine returns, so
every adapter keeps one rendering path.

The wire format is small on purpose — `count`, `subtotal` and `total` are all
optional, and a cell the server omits is an empty cell rather than a zero.
