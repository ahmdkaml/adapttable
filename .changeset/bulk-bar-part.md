---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

The bulk action bar carries its part names in every kit. `bulk-bar`,
`bulk-button`, `bulk-error`, `select-all-banner`, `select-all-text` and
`select-all-button` were emitted by `@adapttable/unstyled` alone, so an app
styling or testing the selection bar got a different answer per kit. All seven
adapters now name the same elements.
