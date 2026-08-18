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
---

Collapsible column groups are first-class tree parents (`ColumnGroupDef` with
`children`) rather than a collapsed-to-first-leaf shortcut. Each group decides
what remains: an arrow stub, `collapsedKey`, or `collapsedRender`. The spanning
header hides the stub caption; the toggle's `aria-label` names the group.
`align` on a group defaults to `"center"` (the previous hardcoded look).
`columns` is `ColumnInput[]`; flatten and collapse live in core.
