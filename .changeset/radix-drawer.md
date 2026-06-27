---
"@adapttable/radix": patch
---

Render `filtersMode="drawer"` as a real side drawer in the Radix adapter.

Radix Themes ships no Drawer primitive, so the drawer previously fell back to a
centered Dialog (a modal). It now pins to the inline-end edge at full height and
slides in from that edge — RTL-correct via logical insets and honoring
`prefers-reduced-motion` — while keeping the Dialog's backdrop, focus trap, and
Escape / outside-click dismissal.
