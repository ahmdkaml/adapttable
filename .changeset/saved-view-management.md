---
"@adapttable/core": minor
---

`useSavedViews` gains `rename`, `move`, `setDefault` and `defaultView` — the
operations a view-management UI needs.

`rename` keeps a view's place and refuses a name already in use, because
silently merging two views is how a rename loses one. `move` steps through the
list and stops at the ends rather than wrapping. `setDefault` marks the view the
table opens with; naming the same view again clears it, and only one view can
hold it. Every operation is a no-op on an unknown name.
