---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/antd": patch
"@adapttable/unstyled": patch
---

Sticky tables draw their row separators again. A sticky header switches the
table to separate borders, where a browser ignores borders set on a row, so
the dividers are painted on the cells instead (Mantine).

Mobile cards carry `data-selected` when selected, so a card can be styled from
CSS the way a desktop row already could.

A column with `mobileLabel: ""` now renders no label at all, instead of an
empty line that still took space or the header substituted back in.
