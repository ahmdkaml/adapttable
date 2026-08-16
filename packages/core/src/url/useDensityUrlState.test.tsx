/**
 * Density in the URL.
 *
 * The interesting rule is what does NOT get written: choosing the default
 * removes the parameter rather than restating it, so a shared link carries
 * what someone chose and nothing else.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { UrlStateAdapter } from "./adapter";
import { useDensityUrlState } from "./useDensityUrlState";

function memoryAdapter(initial = ""): UrlStateAdapter & { search: string } {
  let search = initial;
  const listeners = new Set<() => void>();
  return {
    get search() {
      return search;
    },
    getSearch: () => search,
    setSearch: (next) => {
      search = next;
      for (const listener of listeners) listener();
    },
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

describe("useDensityUrlState", () => {
  it("is comfortable until something says otherwise", () => {
    const urlAdapter = memoryAdapter();
    const { result } = renderHook(() => useDensityUrlState({ urlAdapter }));

    expect(result.current.density).toBe("comfortable");
  });

  it("reads what the URL already carries", () => {
    const urlAdapter = memoryAdapter("density=compact");
    const { result } = renderHook(() => useDensityUrlState({ urlAdapter }));

    expect(result.current.density).toBe("compact");
  });

  it("writes a choice into the URL", () => {
    const urlAdapter = memoryAdapter();
    const { result } = renderHook(() => useDensityUrlState({ urlAdapter }));
    act(() => {
      result.current.onDensityChange("compact");
    });

    expect(urlAdapter.search).toContain("density=compact");
    expect(result.current.density).toBe("compact");
  });

  it("removes the parameter when the default is chosen again", () => {
    const urlAdapter = memoryAdapter("density=compact");
    const { result } = renderHook(() => useDensityUrlState({ urlAdapter }));
    act(() => {
      result.current.onDensityChange("comfortable");
    });

    // A link should carry what someone chose, not restate what the table
    // would have done anyway.
    expect(urlAdapter.search).not.toContain("density");
  });

  it("honours a host default, and writes only a departure from it", () => {
    const urlAdapter = memoryAdapter();
    const { result } = renderHook(() =>
      useDensityUrlState({ urlAdapter, defaultDensity: "compact" })
    );

    expect(result.current.density).toBe("compact");

    act(() => {
      result.current.onDensityChange("compact");
    });

    expect(urlAdapter.search).not.toContain("density");

    act(() => {
      result.current.onDensityChange("comfortable");
    });

    expect(urlAdapter.search).toContain("density=comfortable");
  });

  it("ignores a value the table does not have", () => {
    const urlAdapter = memoryAdapter("density=enormous");
    const { result } = renderHook(() => useDensityUrlState({ urlAdapter }));

    expect(result.current.density).toBe("comfortable");
  });

  it("keeps other parameters intact", () => {
    const urlAdapter = memoryAdapter("sort=name&page=2");
    const { result } = renderHook(() => useDensityUrlState({ urlAdapter }));
    act(() => {
      result.current.onDensityChange("compact");
    });

    expect(urlAdapter.search).toContain("sort=name");
    expect(urlAdapter.search).toContain("page=2");
  });

  it("namespaces itself so two tables on a page do not collide", () => {
    const urlAdapter = memoryAdapter();
    const { result } = renderHook(() =>
      useDensityUrlState({ urlAdapter, urlKey: "left" })
    );
    act(() => {
      result.current.onDensityChange("compact");
    });

    expect(urlAdapter.search).toContain("left.density=compact");
  });
});
