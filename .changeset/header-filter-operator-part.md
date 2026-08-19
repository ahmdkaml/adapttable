---
"@adapttable/antd": patch
"@adapttable/base-ui": patch
---

Antd range operators expose `filter-operator`. The base-ui header filter treats its listbox portal as nested, so picking an operator does not close the overlay.
