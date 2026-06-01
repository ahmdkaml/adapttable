import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { createMemoryAdapter } from "./adapter";
import { useTableUrlState } from "./useTableUrlState";

afterEach(() => {
  window.history.replaceState(null, "", "/");
});

function renderWith(
  initial = "",
  extra?: Parameters<typeof useTableUrlState>[0]
) {
  const adapter = createMemoryAdapter(initial);
  const view = renderHook(() => useTableUrlState({ adapter, ...extra }));
  return { adapter, ...view };
}

describe("useTableUrlState", () => {
  it("reads page / limit / search / sort from the URL", () => {
    const { result } = renderWith(
      "page=2&limit=50&q=foo&sortBy=name&sortDir=desc"
    );
    expect(result.current.page).toBe(2);
    expect(result.current.limit).toBe(50);
    expect(result.current.search).toBe("foo");
    expect(result.current.sortBy).toBe("name");
    expect(result.current.sortDir).toBe("desc");
  });

  it("applies defaults when the URL is empty", () => {
    const { result } = renderWith("", {
      defaults: { limit: 10, sortBy: "createdAt", sortDir: "asc" },
    });
    expect(result.current.limit).toBe(10);
    expect(result.current.sortBy).toBe("createdAt");
    expect(result.current.sortDir).toBe("asc");
  });

  it("setPage writes >1 and drops the param at 1", () => {
    const { result, adapter } = renderWith();
    act(() => result.current.setPage(3));
    expect(adapter.getSearch()).toBe("page=3");
    act(() => result.current.setPage(1));
    expect(adapter.getSearch()).toBe("");
  });

  it("setLimit resets page and drops the param at the default", () => {
    const { result, adapter } = renderWith("page=4");
    act(() => result.current.setLimit(50));
    expect(adapter.getSearch()).toBe("limit=50");
    act(() => result.current.setLimit(25));
    expect(adapter.getSearch()).toBe("");
  });

  it("setSearch writes q, trims, resets page, and clears when blank", () => {
    const { result, adapter } = renderWith("page=2");
    act(() => result.current.setSearch("  hi  "));
    expect(adapter.getSearch()).toBe("q=hi");
    act(() => result.current.setSearch(""));
    expect(adapter.getSearch()).toBe("");
  });

  it("setSort writes both keys and clears them with undefined", () => {
    const { result, adapter } = renderWith();
    act(() => result.current.setSort("name", "desc"));
    expect(adapter.getSearch()).toContain("sortBy=name");
    expect(adapter.getSearch()).toContain("sortDir=desc");
    act(() => result.current.setSort(undefined));
    expect(adapter.getSearch()).toBe("");
  });

  it("setSort defaults the direction to asc", () => {
    const { result, adapter } = renderWith();
    act(() => result.current.setSort("name"));
    expect(adapter.getSearch()).toContain("sortDir=asc");
  });

  it("setExtra / setExtras round-trip and clearAll wipes state", () => {
    const { result, adapter } = renderWith("keep=me", {
      arrayExtraKeys: ["tags"],
    });
    act(() => result.current.setExtra("status", "Active"));
    expect(adapter.getSearch()).toContain("f_status=Active");
    act(() => result.current.setExtras({ tags: ["a", "b"] }));
    expect(adapter.getSearch()).toContain("f_tags=a%2Cb");
    act(() => result.current.clearAll());
    expect(adapter.getSearch()).toBe("keep=me");
  });

  it("setExtra(undefined) removes a filter", () => {
    const { result, adapter } = renderWith("f_status=Active");
    act(() => result.current.setExtra("status", undefined));
    expect(adapter.getSearch()).toBe("");
  });

  it("disabled mode keeps state local and never touches the URL", () => {
    window.history.replaceState(null, "", "/?page=9");
    const { result } = renderHook(() => useTableUrlState({ enabled: false }));
    expect(result.current.page).toBe(1);
    act(() => result.current.setPage(4));
    expect(result.current.page).toBe(4);
    expect(window.location.search).toBe("?page=9");
  });

  it("defaults to the history adapter when enabled and no adapter is given", () => {
    window.history.replaceState(null, "", "/?page=7");
    const { result } = renderHook(() => useTableUrlState());
    expect(result.current.page).toBe(7);
    act(() => result.current.setPage(2));
    expect(window.location.search).toBe("?page=2");
  });
});
