---
"@adapttable/core": patch
---

The density and pivot parameters hold their optimistic value until the URL write
lands, so both survive a router that navigates asynchronously. A choice made
through `useDensityUrlState` or `usePivotUrlState` no longer flicks back to the
previous one for a render while a router adapter's navigation is in flight, a
burst of changes coalesces into one write, and a change left pending when the
table unmounts is flushed rather than dropped — the behaviour the column-layout
and formula hooks already had.
