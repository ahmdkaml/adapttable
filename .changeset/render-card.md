---
"@adapttable/core": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

`renderCard` replaces a mobile card's body with your own layout, in every
adapter.

Only the body: the list-item semantics, selection checkbox, expand and tree
toggles, reorder controls, row actions and detail panel keep rendering around
what you return, so a custom card cannot drop the parts that make the list
usable.

It is handed the fields the built-in would have laid out — each one's column,
resolved label and value node, cell renderers and editors included — so a custom
card is a layout decision rather than a re-implementation. Omit it and the
built-in card renders, byte for byte.
