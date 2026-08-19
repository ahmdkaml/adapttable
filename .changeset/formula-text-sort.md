---
"@adapttable/core": patch
---

A formula column sorts by what its value is: text alphabetically, numbers
numerically, `FALSE` before `TRUE`. A text formula such as `=UPPER(name)` is
sortable from its header, where before every row shared one key and clicking
reordered nothing.

A blank and an error group at the end of the column in either direction — where
a spreadsheet leaves an error — rather than sorting as zero among real values.

A column that declares `sortValue` now owns its whole ordering, including the
rows it answers `null` for. Those rows group at the end instead of falling back
to the column's accessor, which ordered one column by two extractors at once.
