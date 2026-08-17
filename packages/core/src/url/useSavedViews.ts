import { useCallback, useEffect, useMemo, useState } from "react";

import type { LayoutStorage } from "../columns/useColumnLayoutStorageState";
import { safeLocalStorage } from "../utils/env";
import { type UrlStateAdapter, useResolvedAdapter } from "./adapter";
import {
  FILTER_PREFIX,
  PARAM_COL_GROUPS,
  PARAM_COL_HIDDEN,
  PARAM_COL_ORDER,
  PARAM_COL_PINNED,
  PARAM_COL_WIDTHS,
  PARAM_DENSITY,
  PARAM_FILTER_TREE,
  PARAM_GROUP_BY,
  PARAM_GROUP_CLOSED,
  PARAM_LIMIT,
  PARAM_PAGE,
  PARAM_PIVOT,
  PARAM_ROW_PIN,
  PARAM_SEARCH,
  PARAM_SORT,
  PARAM_SORT_BY,
  PARAM_SORT_DIR,
} from "./serialize";

/** One captured view: a name plus the table's own URL params. */
export interface SavedView {
  name: string;
  /** The table-scoped query string (only this table's params). */
  search: string;
  /**
   * Whether this is the view the table opens with. At most one view carries
   * it — setting it on another clears the first, because "default" that can
   * be true twice is not a default.
   */
  isDefault?: boolean;
  /**
   * Who the view is for. `"private"` is the default and needs no storage
   * beyond this browser; `"team"` is one a store shares with other people.
   */
  visibility?: SavedViewVisibility;
  /**
   * Whether this reader may change it. A team view someone else owns arrives
   * read-only, and the panel must show it as such rather than offering
   * controls that will fail — a disabled control is information; a control
   * that silently does nothing is a bug the user is blamed for.
   */
  readOnly?: boolean;
}

/** Who a saved view is for. */
export type SavedViewVisibility = "private" | "team";

/**
 * Somewhere to keep views other than this browser.
 *
 * Async on purpose: the whole point is a server, and a synchronous interface
 * would have to be faked by every implementation. `localStorage` remains the
 * zero-config default, so a table that never passes a store keeps working
 * offline with no server at all.
 */
export interface SavedViewsStore {
  /** Every view this reader can see, in the order to show them. */
  list: () => Promise<readonly SavedView[]>;
  /** Create or replace one. */
  save: (view: SavedView) => Promise<void>;
  /** Delete one by name. */
  remove: (name: string) => Promise<void>;
}

/** Options for {@link useSavedViews}. */
export interface UseSavedViewsOptions {
  /** Storage key for the view list, e.g. `"people-table-views"`. */
  storageKey: string;
  /** Storage backend. Defaults to `localStorage`; memory-only under SSR. */
  storage?: LayoutStorage;
  /**
   * Keep views somewhere other than this browser — a server, usually. Given
   * one, it replaces `storage` entirely: two sources of truth for the same
   * list is how a view comes back after being deleted.
   */
  store?: SavedViewsStore;
  /** What `save` marks a new view as. Defaults to `"private"`. */
  visibility?: SavedViewVisibility;
  /** The table's URL-state backend (same one the table uses). */
  urlAdapter?: UrlStateAdapter;
  /** The table's URL namespace — must match the table's `urlKey`. */
  urlKey?: string;
  /**
   * Mirror of the table's URL-sync switch. When `false` (and no explicit
   * `urlAdapter` is given) views capture and apply against an in-memory
   * backend instead of the address bar — matching a table mounted with
   * URL sync off.
   * @defaultValue true
   */
  urlSync?: boolean;
}

/** Result of {@link useSavedViews}. */
export interface UseSavedViewsResult {
  /** The saved views, in save order. */
  views: readonly SavedView[];
  /** Capture the table's CURRENT state under a name (replaces same-name). */
  save: (name: string) => void;
  /** Apply a saved view to the table (other tables' params untouched). */
  apply: (name: string) => void;
  /** Remove a saved view. */
  remove: (name: string) => void;
  /**
   * Rename a view, keeping its place in the list. A no-op when the name is
   * unknown or the new name is taken — silently merging two views is how a
   * rename loses one.
   */
  rename: (from: string, to: string) => void;
  /**
   * Move a view one step through the list. Past either end does nothing
   * rather than wrapping.
   */
  move: (name: string, delta: -1 | 1) => void;
  /**
   * Make a view the default, or clear the default by passing its own name
   * again. Only one view can hold it.
   */
  setDefault: (name: string) => void;
  /** The default view, when one is set. */
  defaultView: SavedView | undefined;
}

const BARE_PARAMS = [
  PARAM_PAGE,
  PARAM_LIMIT,
  PARAM_SEARCH,
  PARAM_SORT_BY,
  PARAM_SORT_DIR,
  // The multi-sort chain — it supersedes sortBy/sortDir, so a view that
  // missed it could neither capture nor displace an active chain.
  PARAM_SORT,
  PARAM_GROUP_BY,
  PARAM_COL_HIDDEN,
  PARAM_COL_PINNED,
  PARAM_COL_ORDER,
  PARAM_COL_WIDTHS,
  PARAM_COL_GROUPS,
  PARAM_ROW_PIN,
  // The advanced filter tree, collapsed groups, density and the pivot. A
  // view that captured everything EXCEPT these looked like it worked and
  // then quietly dropped the most laboriously built parts of the state.
  PARAM_FILTER_TREE,
  PARAM_GROUP_CLOSED,
  PARAM_DENSITY,
  PARAM_PIVOT,
];

/**
 * A store that rejects leaves the list as the user last saw it rather than
 * throwing into a render. The alternative — an unhandled rejection — takes
 * the page down over a failed view save.
 */
function swallow(): void {
  return undefined;
}

/** A view without its default flag, so the stored shape stays minimal. */
function omitDefault(view: SavedView): SavedView {
  if (view.isDefault === undefined) return view;
  return { name: view.name, search: view.search };
}

/** Whether a param key belongs to the table at namespace `ns`. */
function ownsParam(key: string, ns: string): boolean {
  return (
    BARE_PARAMS.some((p) => key === ns + p) ||
    key.startsWith(ns + FILTER_PREFIX)
  );
}

/** The table-scoped subset of a full query string. */
function captureTableParams(search: string, ns: string): string {
  const all = new URLSearchParams(search);
  const own = new URLSearchParams();
  all.forEach((value, key) => {
    if (ownsParam(key, ns)) own.set(key, value);
  });
  return own.toString();
}

function readStored(
  storage: LayoutStorage | undefined,
  key: string
): SavedView[] {
  if (!storage) return [];
  try {
    const raw = storage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (v): v is SavedView =>
        typeof v === "object" &&
        v !== null &&
        typeof (v as SavedView).name === "string" &&
        typeof (v as SavedView).search === "string"
    );
  } catch {
    return [];
  }
}

/**
 * Headless saved views: capture the table's current URL state (search,
 * sort, page, filters, column layout — ONLY this table's params) under a
 * name, persist the list, and re-apply on demand without touching other
 * tables sharing the URL. Wire it to any menu in the `toolbar` slot.
 */
export function useSavedViews({
  storageKey,
  storage,
  store,
  visibility = "private",
  urlAdapter,
  urlKey,
  urlSync = true,
}: UseSavedViewsOptions): UseSavedViewsResult {
  const resolved = useResolvedAdapter(urlAdapter, urlSync);
  const ns = urlKey ? `${urlKey}.` : "";
  const backend = useMemo<LayoutStorage | undefined>(() => {
    if (storage) return storage;
    return safeLocalStorage();
  }, [storage]);

  // Start empty and hydrate from storage AFTER mount: reading storage in
  // the initializer made the client's first render differ from the
  // server's whenever views were saved (hydration mismatch).
  const [views, setViews] = useState<SavedView[]>([]);
  useEffect(() => {
    if (store) return;
    setViews(readStored(backend, storageKey));
  }, [backend, storageKey, store]);

  useEffect(() => {
    if (!store) return undefined;
    // A store's answer can arrive after the table has moved on; ignore a
    // reply that is no longer the one being waited for.
    let current = true;
    void store.list().then(
      (remote) => {
        if (current) setViews([...remote]);
      },
      () => {
        // A store that cannot be reached leaves the list empty rather than
        // throwing into a render. The table still works; the views do not.
        if (current) setViews([]);
      }
    );
    return () => {
      current = false;
    };
  }, [store]);

  const persist = useCallback(
    (next: SavedView[], changed?: SavedView, removed?: string) => {
      setViews(next);
      if (store) {
        // The store owns one view at a time, not the list: sending the whole
        // list back would overwrite what other people changed meanwhile.
        if (removed !== undefined) void store.remove(removed).catch(swallow);
        if (changed) void store.save(changed).catch(swallow);
        return;
      }
      try {
        backend?.setItem(storageKey, JSON.stringify(next));
      } catch {
        // Storage may be full or denied — the in-memory list still works.
      }
    },
    [backend, storageKey, store]
  );

  const save = useCallback(
    (name: string) => {
      const view: SavedView = {
        name,
        search: captureTableParams(resolved.getSearch(), ns),
        ...(visibility === "private" ? {} : { visibility }),
      };
      persist([...views.filter((v) => v.name !== name), view], view);
    },
    [views, persist, resolved, ns, visibility]
  );

  const rename = useCallback(
    (from: string, to: string) => {
      const trimmed = to.trim();
      if (trimmed === "" || from === trimmed) return;
      // Renaming onto an existing name would merge two views into one and
      // lose whichever lost the race. Refuse instead.
      if (views.some((view) => view.name === trimmed)) return;
      const target = views.find((view) => view.name === from);
      // A read-only view belongs to someone else. Refusing here means the
      // panel's disabled controls and the hook agree, rather than the hook
      // quietly accepting what the UI said was impossible.
      if (!target || target.readOnly === true) return;
      persist(
        views.map((view) =>
          view.name === from ? { ...view, name: trimmed } : view
        ),
        { ...target, name: trimmed },
        from
      );
    },
    [views, persist]
  );

  const move = useCallback(
    (name: string, delta: -1 | 1) => {
      const index = views.findIndex((view) => view.name === name);
      const target = index + delta;
      if (index < 0 || target < 0 || target >= views.length) return;
      const next = [...views];
      const [moved] = next.splice(index, 1);
      if (moved) next.splice(target, 0, moved);
      persist(next);
    },
    [views, persist]
  );

  const setDefault = useCallback(
    (name: string) => {
      if (!views.some((view) => view.name === name)) return;
      const target = views.find((view) => view.name === name);
      if (target?.readOnly === true) return;
      // Toggling: naming the current default again clears it.
      const already = views.find((view) => view.isDefault)?.name === name;
      const next: SavedView[] = views.map((view) => {
        const isDefault = !already && view.name === name;
        return isDefault ? { ...view, isDefault } : omitDefault(view);
      });
      persist(
        next,
        next.find((view) => view.name === name)
      );
    },
    [views, persist]
  );

  const apply = useCallback(
    (name: string) => {
      const view = views.find((v) => v.name === name);
      if (!view) return;
      const next = new URLSearchParams(resolved.getSearch());
      // Drop this table's current params, then lay the view's over.
      const stale: string[] = [];
      next.forEach((_, key) => {
        if (ownsParam(key, ns)) stale.push(key);
      });
      for (const key of stale) next.delete(key);
      // Write owned params ONLY — a stored view is external input (old
      // versions, hand-edited storage) and must never touch params that
      // belong to other tables or the surrounding app.
      new URLSearchParams(view.search).forEach((value, key) => {
        if (ownsParam(key, ns)) next.set(key, value);
      });
      resolved.setSearch(next.toString());
    },
    [views, resolved, ns]
  );

  const remove = useCallback(
    (name: string) => {
      const target = views.find((view) => view.name === name);
      if (!target || target.readOnly === true) return;
      persist(
        views.filter((v) => v.name !== name),
        undefined,
        name
      );
    },
    [views, persist]
  );

  return {
    views,
    save,
    apply,
    remove,
    rename,
    move,
    setDefault,
    defaultView: views.find((view) => view.isDefault),
  };
}
