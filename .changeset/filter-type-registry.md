---
"@adapttable/core": minor
"@adapttable/mantine": patch
"@adapttable/mui": patch
"@adapttable/chakra": patch
"@adapttable/antd": patch
"@adapttable/radix": patch
"@adapttable/base-ui": patch
"@adapttable/unstyled": patch
"@adapttable/shadcn": patch
---

Public filter type registry

`filterTypes` registers a custom type (widget, predicate, chips,
serialization) or `registry.extend`s a built-in. Built-ins are the
first consumers — no `switch (def.type)` remains in the engine.
