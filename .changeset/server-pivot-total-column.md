---
"@adapttable/core": patch
---

A server-computed pivot keeps its grand-total column. `serverPivotResult` builds
the total columns under the same rule the local engine follows — grand totals on,
and something splitting the columns — so a table that moves from pivoting in the
browser to pivoting on the server renders the same columns it did before.

A line carries that column's values in `totals`, one per measure. The field is
optional: a server that does not total leaves the column empty, exactly as any
cell it does not send is empty, and `grandTotals: false` asks for no column at
all.
