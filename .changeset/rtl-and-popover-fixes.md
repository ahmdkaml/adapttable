---
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/antd": patch
---

Fix RTL and popover defects found while filming the adapter demos.

**Radix, right-to-left.** Three separate faults stacked: `dir` never reached
the `<table>` (it stopped at the outer box), the ScrollArea that `Table.Root`
wraps the table in writes its own `dir="ltr"` which outranked any inherited
direction, and `justify` compiles to physical `rt-r-ta-left` / `rt-r-ta-right`
classes rather than logical `start` / `end`. Under an Arabic locale the labels
translated but the columns rendered left-to-right, and after the first two
fixes every header and cell still hugged the left edge. All three are handled
now; LTR is untouched.

**Column menu ignored direction (Mantine, MUI, Radix, Base UI).** The menu
portals to `<body>`, so it loses the table's direction unless it is passed
explicitly — only Chakra did. Under RTL the grip and pin controls stayed on
the wrong sides. Every adapter now forwards `dir` to its portalled menu.

**Filter popover jumped over the trigger (Radix, Base UI).** Choosing the
"between" operator reveals a second bound input, and the default collision
handling answered that growth by flipping the whole panel above the trigger,
covering the page header and the control just clicked. The panel now stays
anchored below and scrolls if it runs out of room.

**Ant Design column menu rendered a card inside a card.** The menu repainted
the elevated surface antd's Popover already provides; only spacing belongs to
the adapter now.
