---
"@adapttable/core": patch
"@adapttable/mantine": patch
"@adapttable/unstyled": patch
---

Three fixes surfaced by the new demo pages:

- **core**: in infinite mode, the window growing at the bottom (the
  sentinel incrementing the page) no longer triggers the scroll-to-top
  reset — only real paged navigation does. Reaching the end of a long
  virtualized list no longer teleports the reader back to the top.
- **mantine**: `stickyHeader` now actually pins in page-scroll mode —
  Chromium cannot stick a `th` inside a `border-collapse: collapse`
  table (Mantine's default), so the sticky header switches the table to
  separate borders (visually identical).
- **unstyled**: the chips clear-all button rendered as a bare `<li>` —
  an unstylable stray list bullet. It now carries the same `chip`
  part/class as its siblings, so consumer styling applies.
