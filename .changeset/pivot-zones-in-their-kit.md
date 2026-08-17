---
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
---

The pivot panel's zones are drawn in their own kit: Mantine's theme border and
radius, MUI's outlined surface, Chakra's border tokens, a Radix Card, the
Base UI card. The zone stays a `fieldset` with a `legend`, so a screen reader
still hears which zone a field belongs to.

Radix and Base UI also stack their zones and wrap a field's controls, rather
than laying the three zones out in a row that ran past the panel.
