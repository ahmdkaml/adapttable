---
"@adapttable/core": patch
"@adapttable/chakra": patch
"@adapttable/radix": patch
---

Internal de-duplication: hoist the logic the Chakra and Radix adapters shared
verbatim into `@adapttable/core` — the `<DataTable>` orchestration
(`useDataTableShell`), the auto-filter range-widget logic, and the sticky
cell-style / row-memo helpers. Each adapter now renders only its own kit's
controls over the shared state. No behaviour, markup, or public-API change for
consumers; core stays headless (zero UI-kit imports).
