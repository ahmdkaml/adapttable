---
"@adapttable/core": patch
"@adapttable/i18n": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Road-to-1.0 prep: document the versioning & stability contract, mark the
`mergeProps`/`Props` prop-getter plumbing as `@internal` (consumers use the
`useDataTable` prop-getters, not the merge helper), and add a `smoke-dist`
post-build check that asserts every advertised `exports`/`main`/`module`/`types`
target is actually emitted. No behaviour changes; no breaking changes.
