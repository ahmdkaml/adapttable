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

Flex columns, bounds, and filling the container

A column now takes `minWidth`, `maxWidth` and `flex` beside its `width`.
`fitColumns` makes the columns share the container instead of overflowing it:
columns with a width keep it, columns with a flex take that share, and the rest
divide what remains — with a width the user dragged winning over all of it.

Underneath is CSS the browser already knows — a fixed table layout with
percentage widths — so nothing measures or reflows in JavaScript. The Ant Design
adapter renders through antd's own `<Table>`, which sets its own layout mode;
the per-column widths, bounds and shares still apply there.

Headless: `columnFlexShares`, `columnSizeStyle` and `fittedTableStyle`.
