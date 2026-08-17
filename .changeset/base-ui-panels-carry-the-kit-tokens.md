---
"@adapttable/base-ui": patch
---

`PivotPanel` and `SavedViewsPanel` carry the adapter's tokens. The stylesheet
scopes them to the table root, so a panel mounted beside the table resolved
every `var(--adapttable-*)` to nothing and painted its buttons and badges as
bare text. Both panels now sit in the same scope the table does.
