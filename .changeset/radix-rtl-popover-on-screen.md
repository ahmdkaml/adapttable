---
"@adapttable/radix": patch
---

The filters popover stays on screen under RTL. Collision handling had been
turned off to stop the panel flipping above its trigger when the form grew, but
that switch covers both axes — so a 380px panel anchored near the start edge ran
off the side of the viewport, 136px of it unreachable in Arabic. The panel's
max-height already caps it to the room under the trigger, so it cannot flip;
collision handling is back on for the axis that needed it.
