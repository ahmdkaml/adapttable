---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/radix": patch
---

Boolean and multi-select cell editors now use each kit's own controls. Ant
Design and Mantine open their own multi-select, Chakra renders a styled list
box, and Radix Themes and Base UI — whose select holds one value — show a group
of their own checkboxes through the new `MultiSelectEditorChrome`. Booleans tick
the kit's checkbox everywhere.

Radix and Base UI select editors gained the `edit-cell-editor` part name, the
validation ARIA and focus-on-open that every other kit's editor already had.
