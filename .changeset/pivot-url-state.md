---
"@adapttable/core": minor
---

`usePivotUrlState` puts the pivot configuration in the URL, with
`serializePivot` / `deserializePivot` exported for saved views and anywhere
else a configuration is stored.

The parameter is compact and readable rather than JSON in a query string —
`?pivot=rows:region,team;cols:quarter;sum:amount` — and a hand-edited value
degrades to a simpler pivot instead of throwing.

A custom aggregator has no URL form, so a measure carrying one is left out of
the link rather than written as `sum`, which would quietly change what the link
computes.
