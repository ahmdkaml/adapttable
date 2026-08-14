---
"@adapttable/core": minor
"@adapttable/i18n": minor
---

Ctrl/Cmd+C copies the selected cell rectangle as tab-separated text — the format
Excel, Google Sheets, Numbers and LibreOffice read — so it pastes into columns
rather than one cell. Ctrl/Cmd+X copies and then calls `onCut(range)`; the table
clears nothing itself, because a cut that emptied cells before the clipboard
accepted them would lose the data.

Values resolve exactly as an export's do, so a copy and a downloaded file agree.
The outcome is announced through `labels.gridRangeCopied` and
`gridRangeCopyFailed`, translated in all seventeen locales — the Clipboard API
needs a secure context and can be refused, and a copy that silently did nothing
is the thing worth avoiding.

`clipboardRangeText` and `writeClipboardText` are the headless halves.
