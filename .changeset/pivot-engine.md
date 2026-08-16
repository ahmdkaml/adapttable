---
"@adapttable/core": minor
---

`@adapttable/core/pivot` — rows down the side, dimensions across the top, a
measure in every cell.

Multiple dimensions on both axes, the built-in aggregations and your own,
subtotals for every level and a grand total, and collapsible groups. It returns
the column header tree, the rendered columns and every body line; the rendering
stays with your adapter.

A separate entry, so it costs 1.4 KB gzipped to the tables that import it and
nothing to the rest — the bundle budget asserts the main entry carries none of
it, even when you import everything from it.
