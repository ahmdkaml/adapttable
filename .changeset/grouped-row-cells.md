---
"@adapttable/core": patch
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Grouped rows carry their cells

A grouped body renders `grouping.entries`, a list of its own — so its leaves now
have body cells built for them, and a grouped table draws its rows whatever the
window is showing.
