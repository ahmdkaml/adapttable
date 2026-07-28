---
"@adapttable/mantine": patch
---

Escape closes the Columns and Saved-views menus.

Mantine's `Popover` dismiss reacts to Escape only once focus is inside the
dropdown. The filter popover moves focus in, so it was covered; these two
leave focus on their trigger, where the key did nothing — every other
adapter's kit closes both. Confirmed in a browser across all eight kits.
