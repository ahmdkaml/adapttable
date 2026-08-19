---
"@adapttable/unstyled": patch
"@adapttable/shadcn": patch
---

The saved-views management panel honors the `views*` class-map keys — the
surface, each row, its controls and the rename box — so one preset styles the
panel and the saved-views menu alike. `@adapttable/shadcn` ships the panel
pre-wired with `shadcnClassNames`, the way its `DataTable` already is, and your
own `classNames` still merge over the preset per part.
