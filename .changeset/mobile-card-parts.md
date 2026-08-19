---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

Mobile cards carry their part names. `cards`, `card-detail` and `summary-card`
were emitted by `@adapttable/unstyled` and `@adapttable/antd` only, so an app
styling or testing the card layout got nothing from these five kits.
