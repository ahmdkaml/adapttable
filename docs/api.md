# API reference

A concise map of the public API. Every symbol ships full TypeScript types
and JSDoc, so editor autocomplete is the canonical reference.

## `@adapttable/core`

### Data tiers

Three ways to feed the table, lowest ceremony first:

- `data={rows}` — frontend tier: the table filters/sorts/pages in memory.
- `data` + `total` + `loading` + `onQueryChange(query, { signal })` — server
  tier: the table owns the query state and emits one consolidated
  `TableQuery` per change (initial mount included); you fetch and hand back
  rows. Superseded requests are aborted through `signal`.
- `source={...}` — full control via the source builders:
  - `useFrontendData<TRow>(options): TableSource<TRow>`
  - `useBackendData<TRow, TParams, TPage>(options): TableSource<TRow>`
  - `useServerData<TRow>(options)` / `useTableData<TRow>(options)` — the
    hooks behind the first two tiers, exported for headless use.

### Declarative columns & filters

- `ColumnDef.key` doubles as a dot-path accessor (`"department.name"`);
  `header` is optional (auto-humanized: `hiredAt` → "Hired At" — explicit
  headers always win, in any language).
- `ColumnDef.i18n` + table `locale` — per-locale data paths
  (`{ key: "nameEn", i18n: { ar: "nameAr" } }`, or nested
  `{ key: "name.en", i18n: { ar: "name.ar" } }`): the active locale (exact
  tag → primary subtag → key) picks the path, and the cell, client-side
  sort and the column's filter all follow it. Header text stays whatever
  you pass in `header`.
- `ColumnDef.filter` — `"text" | "select" | "multiSelect" | "dateRange" |
"numberRange"` or a definition object; merged with the table-level
  `filters` array (a `filters` entry with the same key wins, with a dev
  warning). Each definition drives the kit-native widget, the URL parsing,
  the chip label, and (frontend tier) the row predicate.
- `filters` prop: `FilterDef[]` (the adapter builds the form) **or** JSX
  (you draw it). Helpers: `FILTER_TYPES`, `filterLabel`, `filterStateKeys`,
  `resolveFilterDefs`, `buildFilterRuntime`, `filterPredicate`,
  `clearedFilterExtras`, `getPath`, `humanizeKey`, `resolveColumns`.

### State

- `useTableUrlState(options?): { page, limit, search, sortBy, sortDir, extra, setPage, setLimit, setSort, setSearch, setExtra, setExtras, clearExtras, clearAll }`
  — `clearExtras` drops every filter and resets the page while search/sort
  survive (it also backs the built-in clear-filters fallback).
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
  Pin types: `PinSide` (`"left" | "right"`), `PinOffset`, `PinnedSide`.
- Width helpers: `tableMinWidth`, `resolveColumnWidth`, `parsePxWidth`.
- On every adapter `<DataTable>`: `enableColumnMenu`, `resizableColumns`,
  `columnLayout` / `onColumnLayoutChange` / `defaultColumnLayout`,
  `density: "comfortable" | "compact"`, `maxHeight`, `stickyHeader`.

### Orchestration / headless rendering

- `useDataTable<TRow>(options): UseDataTableResult<TRow>` — derived state +
  prop-getters: `getTableProps`, `getHeaderRowProps`, `getHeaderCellProps`,
  `getSortButtonProps`, `getRowProps`, `getCellProps`, `getSearchInputProps`.
- `useTableChrome<TRow>(props)` — shared adapter orchestration (layout,
  confirm, chips, body region + `emptyVariant` (`"noData" | "noResults"`),
  `isRefreshing` (background refetch), `clearFilters`, footer).
- `useChromeBodyData(chrome, props)` — the body data-flow wiring shared by
  adapters: window virtualization + the infinite-scroll sentinel.

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
- `selectedIds` — controlled selection: pass the ids and apply
  `onSelectionChange` requests to your own state (same controlled /
  uncontrolled split as `columnLayout`).
- `rowClassName(row, index)` — conditional per-row class, applied to desktop
  rows and mobile cards alike (e.g. highlight overdue rows).
- `onRowClick` (every adapter `<DataTable>`) — row activation on click/Enter,
  with ArrowUp/ArrowDown roving focus across rows;
  interactive children (actions, checkboxes, links) keep their own behaviour.
  Headless consumers: `rowClickProps(row, onRowClick)`.
- `rowsToCsv(rows, columns, options?)` + `downloadCsv(filename, csv)` — CSV
  export from the table's own column definitions (free; pair with the
  `toolbar` slot).

### Empty & refresh states

- Zero rows under an active search/filter renders the `noResults` label with
  a working clear-filters button (your `onClearFilters`, or the built-in
  `clearExtras` fallback); a truly empty source renders `noData`.
- A background refetch (stale rows on screen) shows each kit's subtle,
  non-blocking progress indicator and sets `aria-busy`.

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
