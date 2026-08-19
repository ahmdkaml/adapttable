---
"@adapttable/core": minor
"@adapttable/server": patch
---

A shared pivot keeps its subtotals, its grand totals and its folded groups.

The `pivot` parameter carries all of it —
`pivot=rows:region,team;cols:quarter;sum:amount;sub:0;hide:EU/Alpha` — so a link
or a saved view reopens showing what its sender was looking at, not the axes
with everything else switched back on. `usePivotUrlState` returns `collapsed`
and `onCollapsedChange` beside the configuration, and `collapsed` is what
`pivot`'s option takes, so the link and the rendering cannot disagree.

`serializePivotState` and `deserializePivotState` are the encoding including the
folded set, as a `PivotUrlState`; both are on `@adapttable/core/pivot` and on the
React-free `@adapttable/core/query`. Only departures from the defaults are
written, so a link or a view from before these fields existed reads back exactly
as it did.

`parseTableQuery` keeps the switches on its `pivot` and reports the folded keys
as `pivotCollapsed`. They are dimension values rather than column names, so no
schema vouches for them: parameterise them like a search term.
