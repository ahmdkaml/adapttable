---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

`resolveMobileLabel` from `@adapttable/core/adapter` resolves a mobile card
field's caption — an explicit `mobileLabel`, then a text `header`, then the
column's key, with `mobileLabel: ""` meaning no caption at all. Every adapter's
card layout now reads it from there, so a custom card can match them exactly.
