---
"@adapttable/core": minor
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Column virtualization

`virtualizeColumns` windows the horizontal axis: a 500-column table renders the
two dozen columns a reader can see, plus a margin, with two spacer cells holding
the rest open. In the benchmark suite that is **45x fewer DOM cells** — 11,001
down to 243 — on the same table.

Both axes compose off one scroll box. Pinned columns are never windowed out,
since a pinned column is on screen by definition, and the spacers are logical,
so a wide RTL table scrolls correctly. `aria-colindex` stays absolute, so a
screen reader still hears "column 74 of 120".

It needs a horizontal scroll container and renders every column until that
container reports a width — an unmeasured table shows everything rather than
guessing. Not available in the Ant Design adapter, which renders through antd's
own `<Table>`.

Headless: `useColumnWindow` and `ColumnSpacer` from `@adapttable/core/adapter`.
