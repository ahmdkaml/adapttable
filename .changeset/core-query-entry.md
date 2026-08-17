---
"@adapttable/core": minor
---

New entry: `@adapttable/core/query` — the query model without React.

It carries the `ft=1.{…}` filter-tree codec (`parseFilterTree`,
`serializeFilterTree`, `isActiveFilterTree`, `FILTER_TREE_PARAM`,
`FILTER_TREE_VERSION`), the `pivot=rows:…` codec (`serializePivot`,
`deserializePivot`), `isFilterGroup`, and the types those speak in —
`QueryCondition`, `QueryFilterGroup`, `SortLevel`, `SortDirection`,
`PivotConfig`, `PivotMeasure`. Nothing else: the entry imports no module of its
own and carries no `"use client"` boundary, so a route handler, a loader or a
plain Node service can decode a shared link in a process where React is not
installed. It measures 0.5 KB gzipped.

Every name is the one `@adapttable/core` already exports, from the same source
module, so the encoding a server reads is the encoding the table wrote.
