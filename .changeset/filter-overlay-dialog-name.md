---
"@adapttable/chakra": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
---

Accessibility: give the filter overlay an accessible name — the Chakra and
Radix filter popovers and the MUI filter drawer now set `aria-label` on their
`role="dialog"` wrapper, fixing an `aria-dialog-name` violation. Locked in with
axe assertions across every adapter's filter overlay (popover + drawer).
