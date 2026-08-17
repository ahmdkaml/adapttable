---
"@adapttable/core": minor
---

`@adapttable/core/formula` — spreadsheet columns computed from your rows.

`buildFormulaColumns` turns user-typed formulas into columns, reporting the
ones that will not parse and any that reference each other in a loop rather
than throwing: a formula bar has to show something useful while someone is
still typing.

A formula is parsed, never evaluated. It does not reach `eval` or
`new Function` — a user-typed formula is untrusted input in the way a URL is,
and in a shared saved view that means whoever sent the link.

Values are tagged rather than bare primitives, so data containing the text
`#REF!` is not mistaken for a cell that failed. Errors propagate the way a
spreadsheet's do, so a wrong number is never quietly totalled.

A separate entry: 2.6 KB gzipped for the tables that import it, and the bundle
budget asserts the main entry carries none of it.
