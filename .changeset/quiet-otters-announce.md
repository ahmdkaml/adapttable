---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/base-ui": patch
"@adapttable/chakra": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/radix": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
"@adapttable/i18n": minor
---

A host-handled export now shows each kit's own loading affordance instead of a
greyed-out button — Mantine's, MUI's, Chakra's and Ant Design's loading buttons,
Radix's and Base UI's spinners, and a styleable `exportSpinner` element in the
unstyled and shadcn presets.

The outcome is announced. A download is silent and a failed one is silent in the
same way, so a polite live region beside the button reads `labels.exportDone` or
`labels.exportFailed`, translated in all seventeen locales. `useExportHandler`
also returns `exportStatus` — `"idle"`, `"busy"`, `"done"` or `"failed"` — for a
toolbar that wants to show more.
