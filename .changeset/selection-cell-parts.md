---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

The selection column's cells carry their part names. `selection-cell` and
`selection-header` were emitted by `@adapttable/unstyled` alone, so an app
styling or testing against those parts got a different answer per kit. They now
land on the same element in all six.
