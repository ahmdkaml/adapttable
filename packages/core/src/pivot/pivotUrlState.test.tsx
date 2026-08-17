/**
 * Keeping the pivot configuration in the URL.
 *
 * The encoding itself is tested in `pivotUrlCodec.test.ts`, which needs no
 * renderer. What is left here is the hook: reading the parameter, writing it
 * back, the overlay that covers the gap until the write lands, and the SSR rule
 * it shares with the other URL hooks.
 */
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createMemoryAdapter, type UrlStateAdapter } from "../url/adapter";
import { EMPTY_PIVOT_CONFIG } from "./pivotConfigModel";
import type { PivotConfig } from "./pivotModel";
import { PIVOT_URL_WRITE_DEBOUNCE_MS, usePivotUrlState } from "./pivotUrlState";

// The URL write is deferred past the batch that asked for it, so advance the
// clock to observe one.
beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

function flushUrl() {
  act(() => {
    vi.advanceTimersByTime(PIVOT_URL_WRITE_DEBOUNCE_MS + 10);
  });
}

describe("usePivotUrlState", () => {
  it("reads a configuration out of the URL", () => {
    const urlAdapter = createMemoryAdapter("?pivot=rows:team;sum:amount");
    const { result } = renderHook(() => usePivotUrlState({ urlAdapter }));

    expect(result.current.config.rows).toEqual(["team"]);
    expect(result.current.config.measures).toEqual([
      { key: "amount", agg: "sum" },
    ]);
  });

  it("writes a change back", () => {
    const urlAdapter = createMemoryAdapter("");
    const { result } = renderHook(() => usePivotUrlState({ urlAdapter }));

    act(() => {
      result.current.onConfigChange({ ...EMPTY_PIVOT_CONFIG, rows: ["team"] });
    });
    flushUrl();

    expect(urlAdapter.getSearch()).toContain("pivot=rows%3Ateam");
    expect(result.current.config.rows).toEqual(["team"]);
  });

  it("reads optimistically before the URL write lands", () => {
    // Deferred rather than same-batch: a router adapter whose write arrives a
    // tick later would otherwise render one frame with the overlay already
    // gone — the field the reader just moved jumping back to where it was.
    const urlAdapter = createMemoryAdapter("");
    const { result } = renderHook(() => usePivotUrlState({ urlAdapter }));

    act(() => {
      result.current.onConfigChange({ ...EMPTY_PIVOT_CONFIG, rows: ["team"] });
    });

    expect(result.current.config.rows).toEqual(["team"]);
    expect(urlAdapter.getSearch()).toBe("");

    flushUrl();

    expect(urlAdapter.getSearch()).toContain("pivot=rows%3Ateam");
    expect(result.current.config.rows).toEqual(["team"]);
  });

  it("coalesces a burst of moves into one trailing write", () => {
    const adapter = createMemoryAdapter("");
    const writes: string[] = [];
    const spied: UrlStateAdapter = {
      ...adapter,
      setSearch: (search: string) => {
        writes.push(search);
        adapter.setSearch(search);
      },
    };
    const { result } = renderHook(() =>
      usePivotUrlState({ urlAdapter: spied })
    );

    act(() => {
      // Somebody building a pivot, one keystroke per zone.
      for (const rows of [["region"], ["region", "team"], ["team"]]) {
        result.current.onConfigChange({ ...EMPTY_PIVOT_CONFIG, rows });
      }
    });
    flushUrl();

    expect(writes).toHaveLength(1);
    expect(writes[0]).toContain("rows%3Ateam");
  });

  it("flushes a pending configuration on unmount so it is not lost", () => {
    const urlAdapter = createMemoryAdapter("");
    const { result, unmount } = renderHook(() =>
      usePivotUrlState({ urlAdapter })
    );

    act(() => {
      result.current.onConfigChange({ ...EMPTY_PIVOT_CONFIG, rows: ["team"] });
    });
    unmount();

    expect(urlAdapter.getSearch()).toContain("pivot=rows%3Ateam");
  });

  it("removes the parameter when the pivot is cleared", () => {
    const urlAdapter = createMemoryAdapter("?pivot=rows:team");
    const { result } = renderHook(() => usePivotUrlState({ urlAdapter }));

    act(() => {
      result.current.onConfigChange(EMPTY_PIVOT_CONFIG);
    });
    flushUrl();

    expect(urlAdapter.getSearch()).not.toContain("pivot");
  });

  it("namespaces the parameter so two tables can share a URL", () => {
    const urlAdapter = createMemoryAdapter("");
    const { result } = renderHook(() =>
      usePivotUrlState({ urlAdapter, urlKey: "left" })
    );

    act(() => {
      result.current.onConfigChange({ ...EMPTY_PIVOT_CONFIG, rows: ["team"] });
    });
    flushUrl();

    expect(urlAdapter.getSearch()).toContain("left.pivot=");
  });

  it("reads nothing before hydration when no adapter was given", () => {
    // The SSR rule the other URL hooks follow: only an explicit adapter is
    // trusted to be hydration-consistent, so the server snapshot is empty.
    const { result } = renderHook(() => usePivotUrlState({ urlSync: false }));

    expect(result.current.config).toEqual(EMPTY_PIVOT_CONFIG);

    act(() => {
      result.current.onConfigChange({ ...EMPTY_PIVOT_CONFIG, rows: ["team"] });
    });

    expect(result.current.config.rows).toEqual(["team"]);
  });

  it("renders on the server without reading a URL it cannot trust", () => {
    // Server-rendered with no explicit adapter: the snapshot has to be the
    // empty pivot, or hydration would disagree with the first client render.
    function Probe() {
      const { config } = usePivotUrlState();
      return <span>{`rows=${String(config.rows.length)}`}</span>;
    }

    expect(renderToString(<Probe />)).toContain("rows=0");
  });

  it("falls back to the given default while the URL is silent", () => {
    const urlAdapter = createMemoryAdapter("");
    const defaultConfig: PivotConfig = {
      ...EMPTY_PIVOT_CONFIG,
      rows: ["region"],
    };
    const { result } = renderHook(() =>
      usePivotUrlState({ urlAdapter, defaultConfig })
    );

    expect(result.current.config.rows).toEqual(["region"]);
  });
});
