# API reference

A concise map of the public API. Every symbol ships full TypeScript types
and JSDoc, so editor autocomplete is the canonical reference.

## `@adapttable/core`

### Source builders

- `useFrontendData<TRow>(options): TableSource<TRow>`
- `useBackendData<TRow, TParams, TPage>(options): TableSource<TRow>`

### State

- `useTableUrlState(options?): { page, limit, search, sortBy, sortDir, extra, setPage, setLimit, setSort, setSearch, setExtra, setExtras, clearAll }`
- `useColumnLayoutUrlState(options?): { layout, onLayoutChange }` — URL-persisted
  column layout (hidden / order / pinned / widths), namespaced by `urlKey`.
- `useColumnLayoutStorageState({ storageKey, storage?, defaultLayout? })` —
  the localStorage counterpart (user preference rather than shareable link).
- `createHistoryAdapter()`, `createMemoryAdapter(initial?)`, `getHistoryAdapter()` → `UrlStateAdapter`

### Column management

- `useColumnLayout({ columns, layout?, onLayoutChange?, defaultLayout? })` —
  headless visibility / order / pinning / width state with `visibleColumns`,
  `toggleVisible`, `move`, `setPinned`, `setWidth`, `pinOffset`, `reset`.
- Menu/markup builders for custom UIs: `columnMenuRows`, `columnRowDragProps`,
  `columnDropProps`, `columnReorderKeyProps` (keyboard reorder, RTL-aware),
  `columnResizeHandleProps` (pointer + arrow-key resize, RTL-aware).
- Pinning style helpers: `pinnedCellStyle`, `edgePinStyle`, `PIN_Z` — logical
  insets (`insetInlineStart/End`), so pins land on the correct edge in RTL.
- Width helpers: `tableMinWidth`, `resolveColumnWidth`, `parsePxWidth`.
- On every adapter `<DataTable>`: `enableColumnMenu`, `resizableColumns`,
  `columnLayout` / `onColumnLayoutChange` / `defaultColumnLayout`,
  `density: "comfortable" | "compact"`, `maxHeight`, `stickyHeader`.

### Orchestration / headless rendering

- `useDataTable<TRow>(options): UseDataTableResult<TRow>` — derived state +
  prop-getters: `getTableProps`, `getHeaderRowProps`, `getHeaderCellProps`,
  `getSortButtonProps`, `getRowProps`, `getCellProps`, `getSearchInputProps`.
- `useTableChrome<TRow>(props)` — shared adapter orchestration (layout,
  confirm, chips, body region, footer).

### Selection, filters, actions

- `useSelection`, `useActiveFilterChips`, `useExtraChips`
- Count filter helpers: `COUNT_OPERATORS`, `COUNT_OPERATOR_SYMBOL`,
  `countFilterExtra`, `clearCountFilterExtra`,
  `countFilterStateFromExtra`, `countFilterChipLabel`,
  `isCountFilterComplete`, `sanitizeCountFilterParams`
- `mergeFilterChips`, `resolveActiveFilterCount` (pure helpers behind the
  adapter chrome)
- `defaultConfirm`, `runRowAction`, `useBulkActionRunner`

### Utilities & hooks

- `useDebounce`, `useMediaQuery`, `useIsMobile`, `usePrefersReducedMotion`,
  `useColorScheme` (resolves `"light" | "dark" | "auto"`)
- `useInfiniteScroll` — IntersectionObserver sentinel that auto-loads the
  next page in infinite mode (returns a ref; re-arms on `itemCount`)
- `useTableVirtualization` — headless window virtualization for rows/cards.
- `useScrollToTableTop` — optional sticky-chrome scroll restoration.
- `compareValues`, `sortRows`, `nextSort`, `computePagination`,
  `visibleColumns`, `mergeProps`, `stableKey`, `resolveLabels`,
  `defaultLabels`, `pageSizeOptions`

### Types

`TableSource`, `ColumnDef`, `RowAction`, `BulkAction`, `PaginatedResponse`,
`TableLabels`, `BaseDataTableProps`, `SortDirection`, `Direction`,
`ColorScheme`, `PaginationMode`, `FilterValue`, `ExtraFilters`,
`VirtualTableRow`, `CountFilterState`, `CountOperator`, …

### Rows & export

- `onSelectionChange(selectedIds)` — observe the selection set (toggles,
  select-all, automatic resets when search/filters change the result set).
- `onRowClick` (every adapter `<DataTable>`) — row activation on click/Enter;
  interactive children (actions, checkboxes, links) keep their own behaviour.
  Headless consumers: `rowClickProps(row, onRowClick)`.
- `rowsToCsv(rows, columns, options?)` + `downloadCsv(filename, csv)` — CSV
  export from the table's own column definitions (free; pair with the
  `toolbar` slot).

### Development warnings

Misconfiguration warns once per message in development (silent in
production): unresolvable sorts, duplicate column keys, two tables sharing a
URL namespace without `urlKey`, and `virtualize` combined with `maxHeight`.

## Adapters

`@adapttable/mantine`, `@adapttable/mui`, `@adapttable/chakra`,
`@adapttable/antd`, and `@adapttable/unstyled` each export:

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
