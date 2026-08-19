---
"@adapttable/core": patch
---

Switching the default saved view writes both views the switch touches — the one
that gains the flag and the one that loses it — so a `store` holds exactly one
default view, and a store already holding more than one is settled by the next
switch.
