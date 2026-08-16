---
"@adapttable/core": minor
---

`pdfWriter` and `buildTablePdf` take a `font`: a TrueType file as bytes.
The writer embeds a subset of it — only the glyphs the table drew — so a
downloaded PDF can draw Arabic, CJK, Cyrillic or any script the built-in
Helvetica cannot. Arabic letters take their contextual forms, lam-alef
becomes one glyph, and right-to-left runs are reordered for drawing, with
the logical text preserved for copy-paste and screen readers. A 421 KB
Arabic face adds about 20 KB to the file.

`openPrintLayout` and `printTable` take `font` too, embedding it as an
`@font-face` so a printed page matches the downloaded one.

Omit `font` and nothing changes: the file is byte-for-byte what it was.
