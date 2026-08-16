---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

Column headers carry `data-adapttable-part="header-cell"` in every kit. Seven
named no header cell, so an app styling or testing `[data-adapttable-part=
"header-cell"]` got nothing from them.
