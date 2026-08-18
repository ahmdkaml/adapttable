---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
---

Built-in row actions and the header-filter trigger use each kit's own icons. Duplicate, delete and pin are icon-only; the label is the tooltip and accessible name. Host `rowActions` still pass `icon` for the same treatment, or omit it for a text button.
