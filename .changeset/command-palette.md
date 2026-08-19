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

`commandPalette` opens a palette on Cmd/Ctrl+K listing every action the table
can perform: type to filter, arrows to move, Enter to run, Escape to close.

Its entries are the same objects the context menus take, so an action is
written once and offered in both rather than drifting between them. Matching
is case- and accent-folded, so "resume" finds "Résumé sync".

Shortcuts are data — a chord and a command key — because remapping is not a
preference when your app may already own Cmd/Ctrl+K. `mod` means Cmd on a Mac
and Ctrl elsewhere; pass `shortcuts: []` to bind nothing.

`onPrint` makes Print a command. Print opens a browser dialog, so it stays the
host's call rather than a permanent button.

New labels `commandPalette`, `commandSearch`, `commandEmpty` and `print` in all
17 locales.
