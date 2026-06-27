---
"@adapttable/core": major
"@adapttable/mantine": major
"@adapttable/mui": major
"@adapttable/chakra": major
"@adapttable/antd": major
"@adapttable/radix": major
"@adapttable/shadcn": major
"@adapttable/unstyled": major
"@adapttable/i18n": major
---

AdaptTable 1.0 — the public API is now stable under semantic versioning.

This release freezes the committed-stable surface: the `@adapttable/core` engine
(source builders, `useDataTable` and its prop-getters, the core types, and the
URL-state hooks), every adapter's `<DataTable>` props and extension points
(`slots`, `classNames`, `toolbar`, `confirm`), and the `@adapttable/i18n` locale
presets. From this release on, breaking changes to that surface ship only in a
major version. There are no runtime behavior changes — this marks the stability
commitment. `@adapttable/cli` is a scaffolding tool and keeps its own cadence.
