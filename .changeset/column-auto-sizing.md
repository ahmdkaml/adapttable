---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/i18n": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

Size a column to its content

Double-click a resize handle and the column takes the width of its widest
rendered cell; the Columns menu's "Size columns to content" does every column at
once.

Measurement comes from the DOM rather than the data, because a cell rendering a
badge, an avatar and a name has no width the data knows. It reads each cell's
content width, so a column currently clipping its text is sized to fit it, and a
column with nothing measurable on screen is left alone rather than collapsed.

The result is an ordinary layout width: it persists, serializes to the URL and
saved views, and a later drag overrides it. Every cell now carries
`data-column-key`, which is also a stable hook for styling one column across any
kit.

Headless: `measureColumnWidth` and `autoSizeColumns`.
