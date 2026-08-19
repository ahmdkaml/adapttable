---
"@adapttable/core": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
---

Consecutive Team (or any row span) stays one cell across a pin. Pinned
rows render in the same tbody as the scroll body so HTML can express the
span; sticky is skipped while a cell is taller than one row.
