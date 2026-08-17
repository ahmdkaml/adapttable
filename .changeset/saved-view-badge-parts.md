---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

The saved-views panel names its badges in every kit. `saved-view-readonly` and
`saved-view-default` were emitted by `@adapttable/unstyled` alone, so an app
styling or testing the read-only and default markers got a different answer per
kit. All seven adapters now name the same elements.
