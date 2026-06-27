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
`useDataTable` prop-getters, not the merge helper), add a `smoke-dist`
post-build check that asserts every advertised `exports`/`main`/`module`/`types`
target is actually emitted, and harden `getPath`/`humanizeKey` to tolerate an
empty/undefined key so a transiently-malformed column key can never crash a
render. No behaviour changes; no breaking changes.
