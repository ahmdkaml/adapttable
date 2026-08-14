---
"@adapttable/antd": patch
---

Column groups render each column once

A deeper header row merges its unlabelled cells across the group boundaries
above it, so one gap can span several parents. Nesting now descends on the
intersection of the two ranges, which keeps every leaf under the single parent
that owns it — a table with two or more group levels drew its ungrouped columns
once per level, in the header and in every row.
