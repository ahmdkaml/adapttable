---
"@adapttable/core": minor
"@adapttable/i18n": minor
"@adapttable/mantine": minor
"@adapttable/mui": minor
"@adapttable/chakra": minor
"@adapttable/antd": minor
"@adapttable/unstyled": minor
"@adapttable/shadcn": minor
---

Logical column pinning, so pinning stays correct under RTL.

**Breaking.** Pinned-side values are now `"start"` / `"end"` (were `"left"` /
`"right"`) — this is the public `pinned` layout value and the `colPin` URL token
(e.g. `colPin=name:start`); pre-existing `left`/`right` URLs no longer parse. The
label keys `pinLeft` / `pinRight` / `moveLeft` / `moveRight` are renamed to
`pinStart` / `pinEnd` / `moveStart` / `moveEnd`, with logical display strings
shipped for every locale. Pinning a data column is now a start-only toggle; the
injected actions column keeps its one-click end-pin.

To migrate: update any `defaultColumnLayout={{ pinned: { x: "left" } }}` to
`"start"` (and `"right"` → `"end"`), any persisted `colPin` URLs, and any custom
`labels` overriding the renamed keys.
