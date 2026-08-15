---
"@adapttable/core": patch
---

An export scoped to `"all"` now writes the rows inside collapsed tree folders.
The rows were always in scope — a folded folder is display state, not a filter —
but the file was built from the rendered hierarchy, which stops at every closed
node, so whole subtrees went missing without a warning.
