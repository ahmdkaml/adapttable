---
"@adapttable/core": minor
"@adapttable/i18n": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/antd": minor
"@adapttable/radix": minor
"@adapttable/base-ui": minor
"@adapttable/unstyled": minor
"@adapttable/shadcn": minor
---

Add opt-in single-level row grouping. Pass `groupBy` to group by one column (frontend tier only; server sources devWarn and ignore). Optional `groupAggregates` shares the `summaryRow` mapper signature for per-group subtotals. Expand/collapse group headers on every adapter (desktop + mobile), with tri-state group selection when checkboxes are on. New `expandGroup`, `collapseGroup`, and `groupCount` labels in core defaults and all i18n locales. Without `groupBy`, grouping stays fully dormant.
