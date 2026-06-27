# Versioning & stability

AdaptTable follows [Semantic Versioning](https://semver.org/). This page states
what that means in practice, what the committed-stable API surface is, and how
deprecations are handled — so you can upgrade with confidence.

## Versioning policy

Given `MAJOR.MINOR.PATCH`:

- **PATCH** — bug fixes and internal improvements that don't change the
  public API. Always safe to adopt.
- **MINOR** — new features and backwards-compatible changes. Code written
  against the current minor keeps working on the next. (Before `1.0`, a minor
  _may_ include breaking changes — see "Pre-1.0" below.)
- **MAJOR** — breaking changes to the public API. We avoid these; when one is
  unavoidable, it ships in a major with a migration note in the CHANGELOG.

The library packages (`@adapttable/core`, the adapters, and `@adapttable/i18n`)
are versioned together as a [changesets](https://github.com/changesets/changesets)
**fixed group**, so a given release lines them all up on one version. You never
need to hunt for a compatible adapter/core pair — install the same version of
each. `@adapttable/cli` is a scaffolding tool and stays on its own cadence; it
is not part of the library surface.

## Pre-1.0

AdaptTable is pre-`1.0`. Until `1.0.0` ships, **minors may include breaking
changes** (per the SemVer `0.x` convention, where `0.MINOR.PATCH` is treated as
the "major" line). In practice breaking changes are rare and called out in the
relevant package's `CHANGELOG.md`. Once `1.0.0` is tagged, the full SemVer
contract above applies and breaking changes require a major bump.

## Public API surface

What "the public API" means — the things we commit to keeping stable:

- **`@adapttable/core`** — the `TableSource` contract; the `useFrontendData` /
  `useBackendData` / `useServerData` source builders; `useDataTable` and its
  prop-getter return (`getTableProps`, `getRowProps`, `getHeaderCellProps`,
  `getSortButtonProps`, `getSearchInputProps`, …); the core types
  (`ColumnDef`, `RowAction`, `BulkAction`, `TableLabels`, `FilterValue`,
  `SortDirection`, `Direction`, …); `BaseDataTableProps`; URL-state hooks
  (`useTableUrlState`, `useColumnLayoutUrlState`, `useSavedViews`) and the
  injectable `UrlStateAdapter`; column-layout, selection, sorting, pagination,
  and virtualization hooks; the filter primitives (`countFilters`, chips,
  range widget); and the i18n-agnostic labels contract.
- **Adapters** — each `<DataTable>`'s props (extending `BaseDataTableProps`),
  its `slots` / `classNames` / `toolbar` / `confirm` extension points, and the
  re-exported source builders.
- **`@adapttable/i18n`** — the locale presets and direction helpers.

Anything exported but not listed above is **internal machinery** exposed
incidentally (helpers like `mergeProps`, barrel re-exports of plumbing). It may
change between minors. If you reach for something outside the surface above,
prefer the documented escape hatches (`slots`, `classNames`, prop-getters, or
the headless `useDataTable`) instead.

## Deprecation policy

When an API is retired, it is **not** removed immediately:

1. The deprecated API is marked `@deprecated` with a JSDoc note pointing to the
   replacement.
2. It keeps working for **at least one minor** release (longer when practical).
3. Removal happens in a **major** release (or, pre-`1.0`, in a minor with an
   explicit CHANGELOG entry).

We never silently remove a documented public API.

## Releasing

Releases are produced by changesets: open a changeset describing the change,
merge it, and the release workflow versions the fixed group together and
publishes to npm with a generated per-package `CHANGELOG.md`. See
[CONTRIBUTING.md](../CONTRIBUTING.md) for the contributor flow.
