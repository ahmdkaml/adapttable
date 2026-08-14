---
"@adapttable/core": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
"@adapttable/shadcn": patch
---

Facet counts exclude the facet's own filter

Checklist counts describe what selecting a value would keep. Frontend
computes them from `allSearchedRows`; a server that declares
`supports.facets` returns the same map on the page.
