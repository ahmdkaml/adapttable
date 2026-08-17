import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import * as env from "../utils/env";
import { createMemoryAdapter } from "./adapter";
import { useSavedViews } from "./useSavedViews";

function fakeStorage(initial: Record<string, string> = {}) {
  const store = new Map(Object.entries(initial));
  return {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => {
      store.set(k, v);
    },
    removeItem: (k: string) => {
      store.delete(k);
    },
    store,
  };
}

describe("useSavedViews", () => {
  it("captures only this table's params and re-applies them", () => {
    const adapter = createMemoryAdapter(
      "t.q=ali&t.f_team=core&t.page=2&other.q=keep"
    );
    const storage = fakeStorage();
    const { result } = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage,
        urlAdapter: adapter,
        urlKey: "t",
      })
    );
    act(() => result.current.save("My view"));
    expect(result.current.views).toHaveLength(1);
    // A foreign table's params never leak into the capture.
    expect(result.current.views[0]!.search).not.toContain("other.q");

    // Mutate the URL away, then apply the view.
    adapter.setSearch("t.q=changed&other.q=keep");
    act(() => result.current.apply("My view"));
    const after = new URLSearchParams(adapter.getSearch());
    expect(after.get("t.q")).toBe("ali");
    expect(after.get("t.f_team")).toBe("core");
    expect(after.get("t.page")).toBe("2");
    expect(after.get("other.q")).toBe("keep");
  });

  const managed = (initial: Record<string, string> = {}) => {
    const storage = fakeStorage(initial);
    const adapter = createMemoryAdapter("t.q=ali");
    const hook = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage,
        urlAdapter: adapter,
        urlKey: "t",
      })
    );
    return { ...hook, storage, adapter };
  };

  const names = (result: { current: { views: readonly { name: string }[] } }) =>
    result.current.views.map((view) => view.name);

  describe("managing the list", () => {
    it("renames a view without moving it", () => {
      const { result } = managed();
      act(() => result.current.save("A"));
      act(() => result.current.save("B"));

      act(() => result.current.rename("A", "Renamed"));

      expect(names(result)).toEqual(["Renamed", "B"]);
    });

    it("refuses a rename that would merge two views", () => {
      // Silently merging is how a rename loses one of them.
      const { result } = managed();
      act(() => result.current.save("A"));
      act(() => result.current.save("B"));

      act(() => result.current.rename("A", "B"));

      expect(names(result)).toEqual(["A", "B"]);
    });

    it("ignores a rename to nothing, or of a view that is not there", () => {
      const { result } = managed();
      act(() => result.current.save("A"));

      act(() => result.current.rename("A", "   "));
      act(() => result.current.rename("ghost", "C"));

      expect(names(result)).toEqual(["A"]);
    });

    it("moves a view one step, and stops at the ends", () => {
      const { result } = managed();
      act(() => result.current.save("A"));
      act(() => result.current.save("B"));

      act(() => result.current.move("B", -1));
      expect(names(result)).toEqual(["B", "A"]);

      act(() => result.current.move("B", -1));
      expect(names(result)).toEqual(["B", "A"]);

      act(() => result.current.move("A", 1));
      expect(names(result)).toEqual(["B", "A"]);
    });

    it("ignores a move of a view that is not there", () => {
      const { result } = managed();
      act(() => result.current.save("A"));

      act(() => result.current.move("ghost", 1));

      expect(names(result)).toEqual(["A"]);
    });

    it("keeps at most one default", () => {
      const { result } = managed();
      act(() => result.current.save("A"));
      act(() => result.current.save("B"));

      act(() => result.current.setDefault("A"));
      expect(result.current.defaultView?.name).toBe("A");

      act(() => result.current.setDefault("B"));
      expect(result.current.defaultView?.name).toBe("B");
      expect(result.current.views.filter((v) => v.isDefault)).toHaveLength(1);
    });

    it("clears the default when the same view is named again", () => {
      const { result } = managed();
      act(() => result.current.save("A"));

      act(() => result.current.setDefault("A"));
      act(() => result.current.setDefault("A"));

      expect(result.current.defaultView).toBeUndefined();
    });

    it("ignores a default for a view that is not there", () => {
      const { result } = managed();
      act(() => result.current.save("A"));

      act(() => result.current.setDefault("ghost"));

      expect(result.current.defaultView).toBeUndefined();
    });

    it("persists the whole managed list, default included", () => {
      const { result, storage } = managed();
      act(() => result.current.save("A"));
      act(() => result.current.setDefault("A"));

      const stored: unknown = JSON.parse(storage.getItem("views") ?? "[]");
      expect(stored).toEqual([
        { name: "A", search: expect.any(String), isDefault: true },
      ]);
    });
  });

  it("captures every piece of state the table can put in a URL", () => {
    // The expensive parts are the ones a view was quietly dropping: an
    // advanced filter tree, which groups are collapsed, the density, and the
    // pivot. A view that restored everything else looked like it worked.
    const full = [
      "t.q=ali",
      "t.sort=name:asc,team:desc",
      "t.groupBy=team",
      "t.groupClosed=core",
      "t.ft=and(eq(team,core))",
      "t.colHide=email",
      "t.colPin=name:start",
      "t.colOrder=name,team",
      "t.colW=name:200",
      "t.colGroupCollapse=contact",
      "t.rowPin=3:top",
      "t.density=compact",
      "t.pivot=rows:team;sum:budget",
      "t.f_team=core",
      "t.page=2",
      "t.limit=25",
    ].join("&");
    const adapter = createMemoryAdapter(full);
    const storage = fakeStorage();
    const { result } = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage,
        urlAdapter: adapter,
        urlKey: "t",
      })
    );

    act(() => result.current.save("Everything"));
    adapter.setSearch("");
    act(() => result.current.apply("Everything"));

    const after = new URLSearchParams(adapter.getSearch());
    for (const pair of full.split("&")) {
      const [key, value] = pair.split("=");
      expect([key, after.get(key ?? "")]).toEqual([
        key,
        decodeURIComponent(value ?? ""),
      ]);
    }
  });

  it("captures and re-applies the multi-sort chain exactly", () => {
    const adapter = createMemoryAdapter("t.sort=name%3Aasc%2Cage%3Adesc");
    const storage = fakeStorage();
    const { result } = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage,
        urlAdapter: adapter,
        urlKey: "t",
      })
    );
    act(() => result.current.save("chained"));
    expect(result.current.views[0]!.search).toContain("t.sort=");

    // A live chain must be DISPLACED by a chainless view (the chain
    // supersedes sortBy/sortDir, so leaving it wins over the view's sort).
    adapter.setSearch("t.sortBy=city&t.sortDir=asc");
    act(() => result.current.save("single"));
    adapter.setSearch("t.sort=team%3Aasc");
    act(() => result.current.apply("single"));
    let params = new URLSearchParams(adapter.getSearch());
    expect(params.get("t.sort")).toBeNull();
    expect(params.get("t.sortBy")).toBe("city");

    // And the chained view restores its chain exactly.
    act(() => result.current.apply("chained"));
    params = new URLSearchParams(adapter.getSearch());
    expect(params.get("t.sort")).toBe("name:asc,age:desc");
    expect(params.get("t.sortBy")).toBeNull();
  });

  it("urlSync: false keeps views working without touching the address bar", () => {
    const before = window.location.search;
    const storage = fakeStorage();
    const { result } = renderHook(() =>
      useSavedViews({ storageKey: "views", storage, urlSync: false })
    );
    act(() => result.current.save("v"));
    act(() => result.current.apply("v"));
    expect(result.current.views).toHaveLength(1);
    expect(window.location.search).toBe(before);
  });

  it("apply never writes params the table does not own", () => {
    const adapter = createMemoryAdapter("t.q=live&app=keep");
    const storage = fakeStorage({
      // External input: an old or hand-edited stored view carrying params
      // that belong to the surrounding app.
      views: JSON.stringify([
        { name: "v", search: "t.q=saved&app=hijacked&other.q=hijacked" },
      ]),
    });
    const { result } = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage,
        urlAdapter: adapter,
        urlKey: "t",
      })
    );
    act(() => result.current.apply("v"));
    const params = new URLSearchParams(adapter.getSearch());
    expect(params.get("t.q")).toBe("saved");
    expect(params.get("app")).toBe("keep");
    expect(params.get("other.q")).toBeNull();
  });

  it("same-name save replaces; remove deletes; unknown apply is a no-op", () => {
    const adapter = createMemoryAdapter("q=a");
    const storage = fakeStorage();
    const { result } = renderHook(() =>
      useSavedViews({ storageKey: "views", storage, urlAdapter: adapter })
    );
    act(() => result.current.save("v"));
    adapter.setSearch("q=b");
    act(() => result.current.save("v"));
    expect(result.current.views).toHaveLength(1);
    expect(result.current.views[0]!.search).toBe("q=b");
    act(() => result.current.apply("missing"));
    expect(adapter.getSearch()).toBe("q=b");
    act(() => result.current.remove("v"));
    expect(result.current.views).toHaveLength(0);
  });

  it("hydrates from storage and survives corrupt payloads", () => {
    const adapter = createMemoryAdapter("");
    const good = fakeStorage({
      views: JSON.stringify([{ name: "x", search: "q=1" }, { bad: true }]),
    });
    const { result } = renderHook(() =>
      useSavedViews({ storageKey: "views", storage: good, urlAdapter: adapter })
    );
    expect(result.current.views).toEqual([{ name: "x", search: "q=1" }]);

    const corrupt = fakeStorage({ views: "{not json" });
    const { result: r2 } = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage: corrupt,
        urlAdapter: adapter,
      })
    );
    expect(r2.current.views).toEqual([]);
  });

  it("a throwing storage backend keeps the in-memory list working", () => {
    const adapter = createMemoryAdapter("q=1");
    const storage = {
      getItem: () => null,
      setItem: () => {
        throw new Error("quota");
      },
      removeItem: () => undefined,
    };
    const { result } = renderHook(() =>
      useSavedViews({ storageKey: "views", storage, urlAdapter: adapter })
    );
    act(() => result.current.save("v"));
    expect(result.current.views).toHaveLength(1);
  });

  it("defaults to localStorage in the browser", () => {
    const adapter = createMemoryAdapter("q=z");
    const { result } = renderHook(() =>
      useSavedViews({ storageKey: "views-default", urlAdapter: adapter })
    );
    act(() => result.current.save("v"));
    expect(
      JSON.parse(globalThis.localStorage.getItem("views-default")!)
    ).toEqual([{ name: "v", search: "q=z" }]);
    globalThis.localStorage.removeItem("views-default");
  });

  it("no storage at all (SSR) → empty list; non-array payloads ignored", () => {
    const adapter = createMemoryAdapter("");
    // storage: undefined exercise — simulate SSR by passing a storage whose
    // getItem yields a non-array JSON value.
    const nonArray = fakeStorage({ views: JSON.stringify({ nope: 1 }) });
    const { result } = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage: nonArray,
        urlAdapter: adapter,
      })
    );
    expect(result.current.views).toEqual([]);
    // Truly empty key → empty list.
    const empty = fakeStorage();
    const { result: r2 } = renderHook(() =>
      useSavedViews({
        storageKey: "views",
        storage: empty,
        urlAdapter: adapter,
      })
    );
    expect(r2.current.views).toEqual([]);
  });

  it("works in-memory under SSR (no storage backend at all)", () => {
    const spy = vi.spyOn(env, "safeLocalStorage").mockReturnValue(undefined);
    const adapter = createMemoryAdapter("q=1");
    const { result } = renderHook(() =>
      useSavedViews({ storageKey: "ssr-views", urlAdapter: adapter })
    );
    expect(result.current.views).toEqual([]);
    act(() => result.current.save("v"));
    expect(result.current.views).toHaveLength(1);
    spy.mockRestore();
  });
});
