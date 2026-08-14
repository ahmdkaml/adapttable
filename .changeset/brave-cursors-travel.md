---
"@adapttable/core": minor
---

`useQuerySource` pages by cursor. Declare `supports: { cursor: true }` and say
where the token lives with `nextCursor: (page) => page.next`, and the table sends
`cursor` alongside the params your query function already receives — the same two
options `useServerData` takes, so the choice of tier no longer decides whether
cursor pagination is available.

Tokens are kept as a trail, so paging back replays the user's own cursors; a
change to the search, sort, filters or page size resets it, because every held
token points into a result that no longer exists.
