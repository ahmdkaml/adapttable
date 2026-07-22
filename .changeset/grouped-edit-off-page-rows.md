---
"@adapttable/core": patch
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/antd": patch
"@adapttable/unstyled": patch
---

Fix inline editing on grouped rows outside the current page slice. The editing
guard validated the active cell against the page slice while the grouped body
renders the full filtered set, so only each group's first rows accepted edits.
The guard and Tab-advance now follow the rendered leaf set via the new
`chrome.editingRows`.
