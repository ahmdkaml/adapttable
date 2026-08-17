---
"@adapttable/core": patch
---

`&` binds below `+` and `-`, as it does in a spreadsheet: `="a" & 2 + 3` is
`"a5"`, and `=1+2 & "x" & 3*4` is `"3x12"`. Comparisons still bind loosest, so
`="a"&"b" = "ab"` is `TRUE`.
