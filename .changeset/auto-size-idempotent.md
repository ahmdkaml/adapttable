---
"@adapttable/core": patch
---

Size-to-content no longer grows a column on every click. A cell that already
fits its content is measured as-is; only a clipped cell gets breathing room.
