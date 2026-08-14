---
"@adapttable/antd": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

The filter popover stops at the viewport edge

The form grows while it is open — an operator can reveal a second bound, a
checklist can run long — and a card taller than the window painted its lower
fields off-screen, where scrolling to reach them dismissed the card instead. It
now caps its height and scrolls inside, as the Radix and Base UI adapters
already did.
