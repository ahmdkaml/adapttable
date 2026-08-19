---
"@adapttable/core": minor
---

Saved views carry a schema version, and `useSavedViews` takes a `migrate` hook,
so views saved by an older table keep working after it changes.

`migrate` runs only for views behind `SAVED_VIEW_VERSION` and is told which
version each came from. Returning `null` drops a view — a view whose columns no
longer exist restores a table nobody asked for, and applying it silently is
worse than losing it. A migration that throws costs that view alone.

`reload()` joins the result: loading happens on mount and on a `storageKey`
change, because a `store` or `migrate` written inline changes identity every
render and cannot be allowed to trigger one.
