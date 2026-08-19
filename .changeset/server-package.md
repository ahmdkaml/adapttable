---
"@adapttable/server": minor
---

New package: `@adapttable/server` parses and validates an AdaptTable query on
the server.

The table's URL is state in the browser and user input everywhere else.
`parseTableQuery` takes the columns a client is allowed to name and drops
anything else — a `sortBy` chosen by the caller never reaches your database.

It never throws: a stale bookmark degrades to a simpler table rather than an
error page, and everything refused is reported so a route that would rather
answer 400 can. Filter trees are all-or-nothing, because dropping one condition
out of an AND quietly widens the result set.

Takes a `Request`, a `URL`, a query string or `URLSearchParams`, so Next.js
route handlers, Remix loaders and Server Actions all work without an adapter.
