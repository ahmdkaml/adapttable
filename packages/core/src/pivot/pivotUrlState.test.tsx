/**
 * The pivot configuration in the URL.
 *
 * The round trip is the whole test: whatever a panel builds must come back
 * identical from a link, or a shared pivot is a different pivot.
 */
import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createMemoryAdapter } from "../url/adapter";
import { EMPTY_PIVOT_CONFIG } from "./pivotConfigModel";
import type { PivotConfig } from "./pivotModel";
import {
  deserializePivot,
  serializePivot,
  usePivotUrlState,
} from "./pivotUrlState";

const full: PivotConfig = {
  rows: ["region", "team"],
  columns: ["quarter"],
  measures: [
    { key: "amount", agg: "sum" },
    { key: "amount", agg: "count" },
  ],
};

describe("serializePivot", () => {
  it("writes something a person could read", () => {
    expect(serializePivot(full)).toBe(
      "rows:region,team;cols:quarter;sum:amount;count:amount"
    );
  });

  it("says nothing about an empty pivot", () => {
    expect(serializePivot(EMPTY_PIVOT_CONFIG)).toBe("");
  });

  it("omits a custom aggregator rather than misreporting it", () => {
    // A function has no URL form, and writing `sum` would change what the
    // link computes without saying so.
    const value = serializePivot({
      ...EMPTY_PIVOT_CONFIG,
      measures: [
        { key: "amount", agg: () => 1 },
        { key: "amount", agg: "avg" },
      ],
    });

    expect(value).toBe("avg:amount");
  });
});

describe("deserializePivot", () => {
  it("comes back identical", () => {
    expect(deserializePivot(serializePivot(full))).toEqual(full);
  });

  it("reads nothing as an empty pivot", () => {
    expect(deserializePivot(null)).toEqual(EMPTY_PIVOT_CONFIG);
    expect(deserializePivot("")).toEqual(EMPTY_PIVOT_CONFIG);
  });

  it("degrades a hand-edited value instead of throwing", () => {
    // A URL is user input. A simpler pivot beats an error page.
    const config = deserializePivot("rows:team;nonsense;bogus:x;cols:");

    expect(config.rows).toEqual(["team"]);
    expect(config.columns).toEqual([]);
    expect(config.measures).toEqual([]);
  });
});

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

    expect(urlAdapter.getSearch()).toContain("pivot=rows%3Ateam");
    expect(result.current.config.rows).toEqual(["team"]);
  });

  it("removes the parameter when the pivot is cleared", () => {
    const urlAdapter = createMemoryAdapter("?pivot=rows:team");
    const { result } = renderHook(() => usePivotUrlState({ urlAdapter }));

    act(() => {
      result.current.onConfigChange(EMPTY_PIVOT_CONFIG);
    });

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
