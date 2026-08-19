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

`printButton` puts Print in the toolbar. It renders only when the option and
`onPrint` are both set — the option alone would open nothing, and the handler
alone stays what it was, the palette's Print command. The caption is
`labels.print`, already translated in every locale. The button carries
`data-adapttable-part="print-button"` in all seven kits and honours the
`printButton` classNames key in unstyled and shadcn.

`printToolbar(wanted, onPrint, labels)` is the one rule that resolves the pair,
exported from `@adapttable/core/adapter` beside `undoRedoToolbar`.
