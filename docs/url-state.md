# URL-synced state

AdaptTable keeps search, sort, page, page-size, and arbitrary filter values
in the URL query string. Reloading the page, sharing the link, or pressing
the back button all land the user on the exact same slice of data.

- `?q=` — search
- `?page=`, `?limit=` — pagination
- `?sortBy=`, `?sortDir=` — sorting
- `?f_<key>=` — extra filters (arrays are comma-separated, numbers parsed)

Defaults are omitted from the URL to keep it clean, and changing any filter
resets the page to 1.

`defaults.extra` provides default extra-filter values when the URL has no
matching `f_<key>` entry. A shared URL value wins over the default for that key.
When the user explicitly clears a defaulted value (removing the chip,
clearing the search, clear-all), the hook records the clearing as an
empty-valued param (`f_status=`, `q=`) so the default does not instantly
resurrect — a missing param means "default applies", an empty one means
"explicitly cleared".

## Multiple tables on one page: `urlKey`

Two tables sharing one URL would clobber each other's params. Give each one
a namespace and every param is prefixed (`left.q`, `left.page`,
`left.f_status`, `right.q`, …):

```tsx
const left = useFrontendData({ data, columns, urlKey: "left" });
const right = useBackendData({ usePaginatedQuery, urlKey: "right" });
```

The same `urlKey` option exists on `useTableUrlState` and
`useColumnLayoutUrlState` for headless consumers.

> **Note:** array filter values are stored as comma-separated entries. Each
> entry is encoded before joining, so ids, enum values, and even labels that
> contain commas round-trip safely.

## Injectable URL adapter

The URL layer is decoupled from any router via a tiny `UrlStateAdapter`.
Core ships two implementations and lets you supply your own:

```ts
interface UrlStateAdapter {
  getSearch(): string; // current query string (no "?")
  setSearch(search: string, opts?: { push?: boolean }): void;
  subscribe(onChange: () => void): () => void;
}
```

- **`createHistoryAdapter()`** — browser History API (the default).
- **`createMemoryAdapter()`** — in-memory; used for SSR, tests, and when URL
  sync is disabled (the table still gets fully working local state).

Integrate with an existing router by implementing the same three methods.
Copy-paste recipes:

### react-router

```tsx
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import type { UrlStateAdapter } from "@adapttable/core";

export function useReactRouterAdapter(): UrlStateAdapter {
  const navigate = useNavigate();
  const location = useLocation();
  return useMemo(
    () => ({
      getSearch: () => location.search.replace(/^\?/, ""),
      setSearch: (search, opts) =>
        navigate({ search }, { replace: !opts?.push }),
      // react-router re-renders on navigation; the hook re-reads getSearch.
      subscribe: () => () => undefined,
    }),
    [location.search, navigate]
  );
}
```

### Next.js (App Router)

```tsx
"use client";
import { useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { UrlStateAdapter } from "@adapttable/core";

export function useNextAdapter(): UrlStateAdapter {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  return useMemo(
    () => ({
      getSearch: () => searchParams.toString(),
      setSearch: (search, opts) => {
        const url = search ? `${pathname}?${search}` : pathname;
        if (opts?.push) router.push(url, { scroll: false });
        else router.replace(url, { scroll: false });
      },
      subscribe: () => () => undefined,
    }),
    [searchParams, pathname, router]
  );
}
```

Pass the adapter to the source hook: `useFrontendData({ data, columns,
adapter: useNextAdapter() })`. With an explicit adapter the table also
hydrates correctly under SSR — the server snapshot reads the adapter, which
knows the request URL.

## Disabling URL sync

```ts
const state = useTableUrlState({ enabled: false });
```

State is kept in a component-local store instead of the URL — handy inside
modals or drawers where you don't want to pollute the address bar.

## Using it directly

```ts
const { page, search, sortBy, setSearch, setSort, setExtra, clearAll } =
  useTableUrlState({ adapter, defaults, numberExtraKeys, arrayExtraKeys });
```
