---
"@adapttable/core": patch
---

Depend on sibling packages by caret range instead of an exact pin.

Adapters declared `workspace:*`, which publishes as an exact version — `@adapttable/mantine@1.2.2` required precisely `@adapttable/core@1.2.2`. Two consequences:

- Every `core` patch forced all eight adapters to republish, even when nothing about them changed.
- A user who installs `@adapttable/core` directly alongside an adapter could end up with **two copies of core** in `node_modules`. Most of core is per-instance state so this is mostly waste, but the URL-namespace registry is module-level: two copies means two registries, so two tables that do not set an explicit `urlKey` can claim the same namespace and overwrite each other's URL state.

`workspace:^` publishes as `^1.2.2`, so an adapter accepts any compatible `core` and the resolver keeps one copy.
