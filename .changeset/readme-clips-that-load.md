---
"@adapttable/core": patch
"@adapttable/cli": patch
"@adapttable/i18n": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Fix the broken hero image on every npm package page, and add a clip per feature.

npm renders README images through GitHub's camo proxy, which refuses anything
over 5 MB. Every demo GIF was 5.2–8.7 MB, so camo returned `Content length
exceeded` and each package page showed a broken image instead of the table.

The clips are now cut per feature — row grouping, cell editing, filtering,
column management and RTL — cropped to the table at native resolution rather
than downscaling the whole page. Each is 232 KB–2.3 MB, and each is sharper
than the 8 MB version it replaces, because a shorter clip spends its budget on
pixels instead of length.
