# Server queries — parse and validate the table's query

The table puts its whole state in the URL. That is what makes a view
shareable and a page reloadable — and the moment that URL reaches a backend
it stops being state and becomes **user input**.

`limit=999999`. `sortBy=password`. A filter on a column that is not in the
table at all. Each is one fetch away from a slow query, a leaked field, or a
stack trace in a log.

```bash
npm install @adapttable/server
```

## One call

```ts
import { parseTableQuery } from "@adapttable/server";

export async function GET(request: Request) {
  const query = parseTableQuery(request, {
    columns: ["name", "team", "budget"],
    maxLimit: 100,
  });

  return Response.json(await people(query));
}
```

`parseTableQuery` takes a `Request`, a `URL`, a query string or
`URLSearchParams` — so Next.js route handlers, Remix loaders and Server
Actions all work without an adapter — and returns a `ServerTableQuery`:

| Field        | What it is                                                   |
| ------------ | ------------------------------------------------------------ |
| `page`       | 1-based, always at least 1                                   |
| `limit`      | clamped to the schema's ceiling                              |
| `offset`     | `(page - 1) * limit`, computed once so every caller does not |
| `search`     | the free-text query, absent when there was none              |
| `sort`       | the multi-sort chain, outermost first                        |
| `groupBy`    | the grouping column, when the schema allows it               |
| `filters`    | column filters, keyed by column                              |
| `filterTree` | the advanced AND/OR tree                                     |
| `pivot`      | the [pivot configuration](./pivot.md)                        |
| `cursor`     | the opaque cursor, in cursor mode                            |
| `rejected`   | everything it refused, and why                               |

## The schema is an allowlist

`columns` is the reason this package exists. A `sortBy` that reaches your
database because nobody checked it is a column name chosen by whoever sent
the request.

```ts
{
  columns: ["name", "team", "budget"],  // what a client may name
  maxLimit: 100,                        // the largest page it may ask for
  defaultLimit: 25,                     // when it asks for none
  urlKey: "left",                       // when two tables share one URL
}
```

A schema cannot raise `maxLimit` past the table's own ceiling of 500.

## Forgiving by default, strict on request

It never throws. Anything invalid is dropped and reported:

```ts
const query = parseTableQuery(request, schema);

query.rejected;
// [{ param: "sortBy", value: "password", reason: "not a sortable column" }]
```

A stale bookmark should give a sensible table, not a 500 — so the default is
to degrade. A route that would rather reject has the list to do it with:

```ts
if (query.rejected.length > 0) {
  return Response.json({ error: query.rejected }, { status: 400 });
}
```

## Filter trees are all or nothing

An unknown field discards the **whole** tree rather than one condition.
Dropping a single condition out of an AND quietly _widens_ the result set,
which is the one failure mode a filter must not have — a request that should
have returned three rows returning three thousand is worse than one that
returned none.

Sorting and pivoting are different: an unusable sort level or pivot field is
dropped on its own, because losing one level of an ordering is a smaller lie
than losing the ordering, and neither can widen anything.

## The types

`parseTableQuery(input, schema)` takes a `QueryInput` — a `Request`, a `URL`,
a query string or `URLSearchParams` — plus a `QuerySchema`, and returns a
`ServerTableQuery`.

`QuerySchema` is the allowlist: `columns`, `maxLimit`, `defaultLimit`,
`urlKey`. `ServerTableQuery` is the table above, where `filters` values are
`ServerFilterValue` (one string, or several for a checklist) and `rejected` is
a list of `QueryRejection` — each carrying the `param` it came from, the
`value` that arrived, and the `reason` it was refused.

Related: [data tiers](./data-tiers.md) · [URL state](./url-state.md) ·
[filtering](./filtering.md) · [pivot tables](./pivot.md)
