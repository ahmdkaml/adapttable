---
"@adapttable/core": patch
"@adapttable/cli": patch
"@adapttable/i18n": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Point each README's demo image at the live demo instead of a raw `.mp4` file,
and deep-link it to that package's own adapter (`/demo/?kit=mui`,
`?kit=radix`, …) now that the kit selector is URL-addressable. Clicking the
image lands on a table you can actually use rather than a video download.
