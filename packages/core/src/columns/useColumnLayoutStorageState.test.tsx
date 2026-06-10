import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ColumnLayoutState } from "./useColumnLayout";
import {
  type LayoutStorage,
  useColumnLayoutStorageState,
} from "./useColumnLayoutStorageState";

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  const storage: LayoutStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
  return { storage, store };
}

const LAYOUT: ColumnLayoutState = {
  hidden: ["email"],
  order: [],
  pinned: { name: "left" },
  widths: { name: 220 },
};

describe("useColumnLayoutStorageState", () => {
  it("falls back to the default layout when storage is empty", () => {
    const { storage } = fakeStorage();
    const { result } = renderHook(() =>
      useColumnLayoutStorageState({
        storageKey: "t",
        storage,
        defaultLayout: { hidden: ["email"] },
      })
    );
    expect(result.current.layout.hidden).toEqual(["email"]);
  });

  it("round-trips a layout through storage", () => {
    const { storage, store } = fakeStorage();
    const { result } = renderHook(() =>
      useColumnLayoutStorageState({ storageKey: "t", storage })
    );
    act(() => result.current.onLayoutChange(LAYOUT));
    expect(result.current.layout).toEqual(LAYOUT);
    expect(JSON.parse(store.get("t")!)).toEqual(LAYOUT);
    // A fresh mount (new visit) restores the stored layout.
    const remount = renderHook(() =>
      useColumnLayoutStorageState({ storageKey: "t", storage })
    );
    expect(remount.result.current.layout).toEqual(LAYOUT);
  });

  it("removes the stored entry when the layout returns to the default", () => {
    const { storage, store } = fakeStorage({
      t: JSON.stringify(LAYOUT),
    });
    const { result } = renderHook(() =>
      useColumnLayoutStorageState({
        storageKey: "t",
        storage,
        defaultLayout: { hidden: ["email"] },
      })
    );
    act(() =>
      result.current.onLayoutChange({
        hidden: ["email"],
        order: [],
        pinned: {},
        widths: {},
      })
    );
    expect(store.has("t")).toBe(false);
  });

  it("survives corrupted storage by falling back", () => {
    const { storage } = fakeStorage({ t: "{not json" });
    const { result } = renderHook(() =>
      useColumnLayoutStorageState({ storageKey: "t", storage })
    );
    expect(result.current.layout.hidden).toEqual([]);
  });

  it("survives a throwing storage backend on write", () => {
    const storage: LayoutStorage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => undefined,
    };
    const { result } = renderHook(() =>
      useColumnLayoutStorageState({ storageKey: "t", storage })
    );
    act(() => result.current.onLayoutChange(LAYOUT));
    // State still updated even though persistence failed.
    expect(result.current.layout).toEqual(LAYOUT);
  });
});
