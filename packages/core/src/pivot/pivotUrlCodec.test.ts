/**
 * The pivot configuration as a URL parameter.
 *
 * The round trip is the whole test: whatever a panel builds must come back
 * identical from a link, or a shared pivot is a different pivot. These run
 * without React on purpose — the codec is what a route handler imports, and a
 * test that needed a renderer would not be testing that.
 */
import { describe, expect, it } from "vitest";

import { EMPTY_PIVOT_CONFIG } from "./pivotConfigModel";
import type { PivotConfig } from "./pivotModel";
import { deserializePivot, serializePivot } from "./pivotUrlCodec";

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
