---
"@adapttable/core": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/antd": minor
"@adapttable/radix": minor
"@adapttable/base-ui": minor
"@adapttable/unstyled": minor
"@adapttable/shadcn": minor
"@adapttable/i18n": patch
---

`densityChooser` puts a density control in the toolbar and `fullscreen` puts a
fullscreen toggle beside it. `useDensityUrlState` keeps the density in the URL
beside sort and filters, so a reload and a shared link reproduce it.

Fullscreen hides everything outside the table, which is what breaks overlays: a
menu portalled to `document.body` sits inside the part being hidden, still
mounted and still focused. The table's own overlays are re-pointed at the
fullscreen element; `useFullscreen` exposes `container` for any you portal
yourself.

The fullscreen toggle hides itself where the browser will not allow fullscreen
at all, because a control that cannot work is worse than no control.

New labels `density`, `densityComfortable`, `densityCompact`, `enterFullscreen`
and `exitFullscreen` in all 17 locales.
