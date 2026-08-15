---
"@adapttable/core": minor
---

Re-evaluate filters and groups from a patch log. `applyRowPatches` already
mutates rows; an IncrementalView on `useFrontendData` now re-filters,
re-sorts, re-groups and re-aggregates only the rows a patch touched.
