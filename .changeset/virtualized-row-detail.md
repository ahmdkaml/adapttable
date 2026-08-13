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

Row detail works under virtualization

A table cannot nest a detail panel inside the row it belongs to, so the two are
separate elements — and a window that measured the row alone reported 56px for
something 300px tall, which is why `renderRowDetail` carried a "not recommended
with `virtualize`" warning.

The window now measures the pair. An open panel reports its real height, one
that grows later corrects itself, and the warning is gone.

Headless: `useRowPairMeasurer` from `@adapttable/core/adapter`.
