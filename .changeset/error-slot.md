---
"@adapttable/core": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/shadcn": patch
"@adapttable/unstyled": patch
---

`slots.error` replaces the load-failure state, in every adapter — the last
piece of chrome that was not replaceable.

It takes a node like the other slots, and it also takes a function, because an
error state is about something: the function receives the error being reported,
the retry the source can actually perform, and whether a retry is already in
flight. `retry` is absent when there is nothing to re-fetch, so a replacement
can hide its retry control rather than render one that does nothing.
