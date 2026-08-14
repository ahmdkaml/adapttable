---
"@adapttable/core": patch
---

A fill commits after the drag ends, not during a render

The fill handle's release ran its commit inside a state updater, which React
executes during render — it warned in development and ran the work twice under
StrictMode. The release now reads where the drag reached and commits after it,
so a fill writes its cells exactly once.
