---
"@adapttable/radix": patch
---

Radix tables no longer crash when they sit just wider than the card. `Table.Root`'s inner ScrollArea is neutralized on every table, so it cannot fight the wrapper's scrollbar and loop React into "Maximum update depth exceeded".
