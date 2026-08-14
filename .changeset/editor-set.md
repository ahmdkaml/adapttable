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
---

Five more cell editors: boolean, date, datetime, time, multi-select

`editor: "boolean"` renders a checkbox and commits `true` / `false` on the tick —
a checkbox has one gesture, and a ticked box that changed nothing reads as a bug.
`"date"`, `"datetime"` and `"time"` use the browser's own controls and commit the
strings those controls hold (`"2026-08-13"`, `"2026-08-13T14:05"`, `"09:30"`); a
column storing a `Date` seeds them from its local parts, because converting to an
instant moves the day for most of the world. `{ type: "multi-select", options }`
commits the array of chosen values and seeds itself from a stored array, so a
host stores back exactly what it gave — an empty selection is `[]`, not `""`.

Headless: `editorInputType`, `isBooleanEditor` / `isSelectEditor` /
`isMultiSelectEditor`, `booleanDraft` / `isDraftChecked`, `formatMultiDraft` /
`readMultiDraft`, and `NativeBooleanEditor` / `NativeMultiSelectEditor` with
`commitBooleanDraft` / `multiDraftFromSelect` from `@adapttable/core/adapter`.
