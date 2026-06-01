# API reference

A concise map of the public API. Every symbol ships full TypeScript types
and JSDoc, so editor autocomplete is the canonical reference.

## `@adapttable/core`

### Source builders

- `useFrontendData<TRow>(options): TableSource<TRow>`
- `useBackendData<TRow, TParams, TPage>(options): TableSource<TRow>`

### State

- `useTableUrlState(options?): { page, limit, search, sortBy, sortDir, extra, setPage, setLimit, setSort, setSearch, setExtra, setExtras, clearAll }`
- `createHistoryAdapter()`, `createMemoryAdapter(initial?)`, `getHistoryAdapter()` → `UrlStateAdapter`

### Orchestration / headless rendering

- `useDataTable<TRow>(options): UseDataTableResult<TRow>` — derived state +
  prop-getters: `getTableProps`, `getHeaderRowProps`, `getHeaderCellProps`,
  `getSortButtonProps`, `getRowProps`, `getCellProps`, `getSearchInputProps`.
- `useTableChrome<TRow>(props)` — shared adapter orchestration (layout,
  confirm, chips, body region, footer).

### Selection, filters, actions

- `useSelection`, `useActiveFilterChips`, `useExtraChips`
- `defaultConfirm`, `runRowAction`, `useBulkActionRunner`

### Utilities & hooks

- `useDebounce`, `useMediaQuery`, `useIsMobile`, `usePrefersReducedMotion`,
  `useColorScheme` (resolves `"light" | "dark" | "auto"`)
- `compareValues`, `sortRows`, `nextSort`, `computePagination`,
  `visibleColumns`, `mergeProps`, `stableKey`, `resolveLabels`, `defaultLabels`

### Types

`TableSource`, `ColumnDef`, `RowAction`, `BulkAction`, `PaginatedResponse`,
`TableLabels`, `BaseDataTableProps`, `SortDirection`, `Direction`,
`ColorScheme`, `PaginationMode`, `FilterValue`, `ExtraFilters`, …

## Adapters

`@adapttable/mantine`, `@adapttable/mui`, `@adapttable/chakra`,
`@adapttable/unstyled` each export:

- `DataTable<TRow>` — the batteries-included component (props extend
  `BaseDataTableProps` plus kit-specific extras like `slots` / `classNames`).
- A re-export of the core source builders and types, so you can import
  everything from one entry point.

## `@adapttable/i18n`

- `getLabels(locale)`, `getDirection(locale)`, `isRtlLocale(locale)`,
  `primarySubtag(locale)`, `RTL_LANGUAGES`, `en`, `ar`, `locales`.

## `@adapttable/cli`

- Binary: `adapttable init [--force]`.
- Programmatic: `detectKit`, `choosePackageManager`, `installCommand`,
  `scaffoldFiles`, `runInit`.
