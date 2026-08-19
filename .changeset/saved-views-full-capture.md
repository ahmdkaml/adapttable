---
"@adapttable/core": patch
---

A saved view now captures the whole table state.

The advanced filter tree, which groups are collapsed, the density and the pivot
configuration were being left behind: a view restored everything else and looked
like it had worked. These are the parts that take longest to rebuild by hand,
which is what makes them worth saving.
