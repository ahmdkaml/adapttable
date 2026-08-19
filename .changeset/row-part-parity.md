---
"@adapttable/core": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
"@adapttable/shadcn": patch
---

Body rows carry `data-adapttable-part="row"` in every kit, and every row carries
`data-row-id`. Six kits named no body row at all, so an app styling or testing
`[data-adapttable-part="row"]` got nothing from them.
