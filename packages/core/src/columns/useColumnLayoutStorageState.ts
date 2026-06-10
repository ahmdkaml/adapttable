import { useCallback, useMemo, useState } from "react";

import { isBrowser } from "../utils/env";
import { stableKey } from "../utils/stableKey";
import { type ColumnLayoutState, EMPTY_COLUMN_LAYOUT } from "./useColumnLayout";

/** The subset of the Web `Storage` API the hook needs (injectable for tests). */
export type LayoutStorage = Pick<Storage, "getItem" | "setItem" | "removeItem">;

/** Options for {@link useColumnLayoutStorageState}. */
export interface UseColumnLayoutStorageStateOptions {
  /** Storage key for this table's layout, e.g. `"people-table-columns"`. */
  storageKey: string;
  /** Storage backend. Defaults to `localStorage`; memory-only under SSR. */
  storage?: LayoutStorage;
  /** Layout applied when storage carries no saved layout yet. */
  defaultLayout?: Partial<ColumnLayoutState>;
}

/** State + change handler returned by {@link useColumnLayoutStorageState}. */
export interface UseColumnLayoutStorageStateResult {
  /** Current layout — from storage, or the default when storage is empty. */
  layout: ColumnLayoutState;
  /** Persist a new layout. Wire to `onColumnLayoutChange`. */
  onLayoutChange: (next: ColumnLayoutState) => void;
}

function readStored(
  storage: LayoutStorage | undefined,
  storageKey: string,
  fallback: ColumnLayoutState
): ColumnLayoutState {
  try {
    const raw = storage?.getItem(storageKey);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<ColumnLayoutState>;
    return { ...EMPTY_COLUMN_LAYOUT, ...parsed };
  } catch {
    // Corrupted/inaccessible storage (private mode, quota) → just fall back.
    return fallback;
  }
}

/**
 * Column layout persisted to `localStorage` (or any injected storage) — the
 * "user preference" counterpart to {@link useColumnLayoutUrlState}'s
 * shareable links. A layout set back to the exact default removes the stored
 * entry, so defaults can evolve in later releases. SSR-safe: without a
 * browser the layout stays in memory for that render.
 *
 * ```tsx
 * const { layout, onLayoutChange } = useColumnLayoutStorageState({
 *   storageKey: "people-table-columns",
 * });
 * <DataTable columnLayout={layout} onColumnLayoutChange={onLayoutChange} … />
 * ```
 *
 * @param options - See {@link UseColumnLayoutStorageStateOptions}.
 * @returns The current layout and a change handler that persists it.
 */
export function useColumnLayoutStorageState(
  options: UseColumnLayoutStorageStateOptions
): UseColumnLayoutStorageStateResult {
  const { storageKey, defaultLayout } = options;
  const storage =
    options.storage ?? (isBrowser() ? globalThis.localStorage : undefined);

  const fallback = useMemo<ColumnLayoutState>(
    () => ({ ...EMPTY_COLUMN_LAYOUT, ...defaultLayout }),
    [defaultLayout]
  );
  const [layout, setLayout] = useState<ColumnLayoutState>(() =>
    readStored(storage, storageKey, fallback)
  );

  const onLayoutChange = useCallback(
    (next: ColumnLayoutState) => {
      setLayout(next);
      try {
        if (stableKey(next) === stableKey(fallback)) {
          storage?.removeItem(storageKey);
        } else {
          storage?.setItem(storageKey, JSON.stringify(next));
        }
      } catch {
        // Storage write failed (quota/private mode) — state still updates.
      }
    },
    [storage, storageKey, fallback]
  );

  return { layout, onLayoutChange };
}
