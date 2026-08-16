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
"@adapttable/i18n": patch
---

`sidePanel` docks table settings beside the table instead of in a popover over
them — a column list, a filter form, anything the host supplies. With more than
one panel the labels become a tab strip with the keyboard behaviour a tab strip
owes: one tab stop, wrapping arrows that carry the selection, Home and End,
Escape to close.

It is controlled — `{ panels, open, onOpenChange, side }` — because the control
that opens it is yours; `toolbarSlots` is where it usually goes. Omit it and
nothing renders and the table's markup is unchanged.

New labels `sidePanel` and `closePanel`, translated in all 17 locales.
