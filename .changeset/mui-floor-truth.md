---
"@adapttable/mui": patch
---

The `@mui/material` peer floor is 6.1.2. Below it, a fresh install resolves
the latest `@mui/utils` 6.x against an older `ModalManager`, and opening the
filter popover crashes in `getScrollbarSize` — the floor now names the oldest
version a new install actually works on. Verified by the packed-tarball floor
probe, which mounts the adapter and exercises sort, the filter popover, row
selection and the column menu at the exact floor version.
