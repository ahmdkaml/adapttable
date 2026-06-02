# Core concepts

## The `TableSource` contract

Everything in AdaptTable revolves around one idea: a **`TableSource<T>`** —
a uniform contract that a table consumes regardless of where its rows came
from. Both built-in source hooks fulfil it, and the table renders without
knowing which produced it.

```ts
interface TableSource<TRow> {
  rows: readonly TRow[];
  total: number;
  isLoading: boolean;
  isFetching: boolean;
  hasNextPage: boolean;
  fetchNextPage: () => void;
  error: Error | null;
  paginationMode: "infinite" | "paged";
  // state
  page: number;
  limit: number;
  search: string;
  sortBy: string | undefined;
  sortDir: "asc" | "desc" | undefined;
  extra: Record<string, string | string[] | number | undefined>;
  // setters
  setPage;
  setLimit;
  setSort;
  setSearch;
  setExtra;
  setExtras;
  clearAll;
}
```

Because the table is agnostic to the source's origin, you can switch between
in-memory and server data — or build a custom source — without touching the
UI.

## Source builders

### `useFrontendData`

In-memory. Filters by a searchable-text projector, sorts by a column's
`sortValue` (or a custom `getSortValue`), and slices for the current page.

```ts
const source = useFrontendData({ data, columns, getSearchText, getSortValue });
```

### `useBackendData`

Server-paginated. Wraps a caller-supplied `useInfiniteQuery` hook and maps
each page to rows via `selectPage`. Flattens pages in infinite mode, returns
the latest page in paged mode, and clamps out-of-range pages.

```ts
const source = useBackendData({ usePaginatedQuery, selectPage, baseParams });
```

## Columns

```ts
interface ColumnDef<TRow> {
  key: string; // unique; also the backend sortBy value
  header: ReactNode; // pre-translated
  Cell?: ComponentType<{ row: TRow; rowIndex: number }>; // stable identity
  accessor?: (row: TRow) => ReactNode; // lightweight
  sortValue?: (row: TRow) => string | number | boolean | null | undefined;
  sortable?: boolean;
  width?: number | string;
  align?: "start" | "center" | "end";
  mobileLabel?: string;
  hideOnMobile?: boolean;
  hideOnDesktop?: boolean;
}
```

## Pagination modes

`"auto"` (the default) resolves to **infinite scroll on mobile** and
**paged on desktop**, using the same breakpoint the table uses, so the two
never drift. Force a mode with `paginationMode: "paged" | "infinite"`.

In infinite mode the adapters auto-load the next page when the bottom of the
list scrolls into view (via `IntersectionObserver`, prefetching ~200px
early), and also render an explicit **Load more** button as a keyboard- and
screen-reader-friendly fallback. The auto-load behaviour is packaged as a
headless hook, `useInfiniteScroll`, exported from `@adapttable/core` — attach
the returned ref to a sentinel element after your last row to get the same
behaviour in custom markup:

```tsx
const sentinelRef = useInfiniteScroll({
  hasNextPage: source.hasNextPage,
  isFetchingNextPage: source.isFetchingNextPage,
  fetchNextPage: source.fetchNextPage,
  itemCount: source.rows.length, // re-arms so short pages keep loading
  enabled: source.paginationMode === "infinite",
});
// …render rows…
<div ref={sentinelRef} />;
```

It is SSR- and test-safe: where `IntersectionObserver` is unavailable it
no-ops, leaving the Load more button as the path forward.

## The two ways to use it

1. **Batteries-included** — `import { DataTable } from "@adapttable/<kit>"`.
2. **Headless** — `import { useDataTable } from "@adapttable/core"` and render
   your own markup with the returned prop-getters.
