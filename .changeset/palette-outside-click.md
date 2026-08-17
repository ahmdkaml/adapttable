---
"@adapttable/core": patch
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
---

The command palette closes on an outside click from core, beside Escape,
instead of each adapter hanging a handler on its own scrim.

A scrim that listens has to carry an ARIA role to justify the handler, and
`presentation` is ignored on an element wrapping a dialog — so the markup was
claiming something ARIA will not honour. The scrims are now inert.
