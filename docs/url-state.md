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

Integrate with an existing router by implementing the same three methods
(e.g. wrapping react-router's `useSearchParams` or Next.js navigation).

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
