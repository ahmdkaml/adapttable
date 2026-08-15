---
"@adapttable/core": patch
---

Checklist filters window long option lists again. A column with hundreds of
distinct values mounts only the options in view plus a margin instead of every
one of them, and `data-virtualized` reports what the list actually does. Lists
under 40 options are unchanged.
