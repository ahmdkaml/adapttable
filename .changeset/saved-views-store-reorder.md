---
"@adapttable/core": minor
---

A saved-views `store` can keep the list's order. Implement the new optional
`reorder(names)` and a reordered list survives a reload, a renamed view included.
A store without it keeps working unchanged — saving, renaming, deleting and the
default all go through `save` and `remove` as before, and `move` reorders on
screen for the session.
