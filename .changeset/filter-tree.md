---
"@adapttable/core": minor
---

AND/OR filter tree engine

A versioned `ft` URL param holds a nested `{ combinator, conditions }`
tree. The frontend predicate evaluates it; a server that declares
`supports.filterTree` receives the same tree on the query. The builder
UI is a follow-up.
