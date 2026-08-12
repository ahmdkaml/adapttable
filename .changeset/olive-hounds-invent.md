---
"@adapttable/core": minor
---

Query cache keys: `tableQueryKey` and `tableQueryBaseKey` turn the emitted
`TableQuery` into stable keys for TanStack Query or SWR. The base key covers
which rows a view shows, the full key adds page and cursor, and the full key
starts with the base one — so invalidating the base key refetches every page of
a view and nothing else. Neither library becomes a dependency.
