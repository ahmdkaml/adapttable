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

Batch editing: many rows, one write

`batchEditing` + `onBatchEdit` turn every editable cell into a field and hold
every change until the reader saves them all — the shape of a review pass, where
someone walks a list correcting values and wants one write at the end rather than
one per row.

`onBatchEdit` is called once, with every pending row as `{ row, rowId, patch }`,
which is what lets the whole batch be a single request. A bar appears as soon as
something is pending — the count, Save all, Cancel all — and is a live region, so
the count is heard as well as seen. Cancel restores everything, because nothing
was ever applied.

The count is rows, not cells, and a value typed back to what it was stops
counting. Changed cells carry `data-changed`.

Labels `pendingRows`, `saveAll` and `cancelAll` are translated in all seventeen
locales. Headless: `useBatchEditing`, with `BatchEditCell` and `BatchEditBar`
from `@adapttable/core/adapter`.
