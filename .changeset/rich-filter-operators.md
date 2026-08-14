---
"@adapttable/core": minor
"@adapttable/i18n": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
"@adapttable/shadcn": patch
---

Rich filter operators per datatype

Text, number and date filters are operator-first. The comparison is stored
as `f_<key>Op` so it survives the URL and Saved Views. Existing links
without an operator keep their old meaning.
