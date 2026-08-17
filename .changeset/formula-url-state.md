---
"@adapttable/core": minor
---

Formula columns travel in the URL and in saved views.

`useFormulaUrlState` keeps the typed columns in the query string —
`formula=total:%3Dquantity%20*%20unitPrice:Total`, one `key:formula[:header]`
entry per column — so a computed column survives a reload and can be sent to
someone. Writes are debounced; reads stay instant through an optimistic
overlay.

`serializeFormulaColumns` and `deserializeFormulaColumns` are the encoding on
its own, exported from `@adapttable/core/formula` and from the React-free
`@adapttable/core/query`, so a route handler can read which columns a shared
link asks for. Reading never evaluates: the codec produces specs and stops, a
hand-edited entry it cannot make sense of is dropped, and a formula that will
not parse arrives as the text it is.

Saved views capture the parameter with the rest of the table's state. A view
saved before formula columns existed carries none, and applying it clears them.
