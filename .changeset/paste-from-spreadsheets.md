---
"@adapttable/core": minor
"@adapttable/antd": patch
"@adapttable/i18n": minor
---

Paste a spreadsheet into the table with Ctrl/Cmd+V

With `cellNavigation` on, Ctrl/Cmd+V parses the tab-separated text Excel, Google
Sheets, Numbers and LibreOffice write — quoted tabs and newlines intact — and
commits it through `onCellEdit`, the same channel inline editing uses. A table
that can be edited can now be pasted into with nothing extra wired. Set
`onCellPaste` to take the batch whole instead, and `onCellCut` to receive what
Ctrl/Cmd+X covered.

The clipboard's shape decides the destination: a 3×2 block pasted into one
focused cell writes 3×2. Cells landing outside the loaded rows or the rendered
columns are dropped, columns that are not `editable` are skipped, and every
value goes through the column's `parseValue`. The outcome is announced in all
seventeen locales.

Headless: `readClipboardText`, `parseClipboardTable`, `pasteRangeEdits` and
`cellPasteHandler`.
