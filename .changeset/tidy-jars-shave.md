---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Server-side export. `exportCsv.request` hands the user's current view — search,
filters, sort, paging and the chosen scope — to your backend instead of
building the file in the browser, which stops being viable once the rows no
longer fit in a tab. Return a promise and the Export button disables itself
with `aria-busy` until it settles, so the same export cannot be started twice.

Also fixes `scope: "selected"` and `columns: "all"` in the Ant Design and
unstyled adapters, which built their export handler without the table's
selection and so silently fell back to the current page.
