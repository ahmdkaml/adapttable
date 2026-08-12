---
"@adapttable/core": minor
---

Cursor pagination on the server tier. Pass `nextCursor` from your API response
and declare `supports: { cursor: true }`, and the table pages by token instead
of offset — so rows inserted or deleted while someone reads never duplicate or
skip an entry. Paging back replays the tokens already issued; a new sort,
filter or search returns to the first page. Sources that do not declare the
capability send no `cursor` and are unchanged.
