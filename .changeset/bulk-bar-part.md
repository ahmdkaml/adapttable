---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

The bulk action bar carries its `bulk-bar` part name. Only
`@adapttable/unstyled` emitted it, so an app styling or testing the bar got a
different answer per kit.
