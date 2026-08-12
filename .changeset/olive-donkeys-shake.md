---
"@adapttable/core": minor
---

Computed columns. `computed({ key, deps, value, format })` declares a derived
column once and wires display, sorting, filtering and export from it — so a
total rendered as `"$1,240.00"` still sorts and exports as `1240` instead of
sorting as text. The value is cached per row and recomputed only when a
declared dependency changes.
