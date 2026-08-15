---
"@adapttable/core": minor
---

`scope: "all"` can now export everything from a server tier. Handing the export
to a backend sends the query with `page` and `limit` undefined, so "all" cannot
be answered with one page, and the new opt-in `fetchAll` lets the table walk the
query itself — capped at `EXPORT_FETCH_ALL_MAX_ROWS` (50,000) by default, with
`onCapped` firing if the cap stopped it short.

With neither wired, a server-backed `"all"` export no longer renders a button at
all. It previously exported the current page as if it were the whole set.
