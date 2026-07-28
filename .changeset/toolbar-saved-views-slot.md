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
---

The toolbar reads **Filters · Saved views · Columns · Export CSV** in every
adapter.

`ToolbarChromeProps` gains a `savedViewsMenu` slot beside `columnMenu`, so the
menu has one named place to mount. Previously core offered no slot for it and
each adapter improvised: four declared the same local prop, mantine passed it
inside the `columnMenu` slot, and mui injected it into the caller's `toolbar` —
so a custom `toolbar` no longer has the saved-views node mixed into it.

The button moves for antd, mui, mantine and the unstyled/shadcn pair. An
order test now runs in each adapter.
