---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

Seven structural parts are addressable in every kit — `row`, `cell`, `table`,
`thead`, `tbody`, `toolbar`, `header-cell`. The table element, its header
section and the toolbar carry `data-adapttable-part` alongside the parts that
already did, so one stylesheet or test selector reaches the same element in
MUI, Mantine, Chakra, antd, Radix and Base UI. In antd, a bounded height splits
the grid into a header table and a body table; both carry the `table` name.
