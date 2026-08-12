---
"@adapttable/core": minor
---

The server query gains optional fields for grouping, aggregates, nested filter
trees, facet counts and cursor pagination, and a `supports` option for
declaring which of them an endpoint can answer.

Declare nothing and nothing changes — the query arrives with exactly the fields
it always has. Declare a capability and its field starts arriving; ask for one
the source has not declared and the field is omitted rather than sent and
ignored, with a development warning naming what would unlock it.
