import { describe, expect, it } from "vitest";

import { compareValues, sortRows } from "./compare";

describe("compareValues", () => {
  it("returns 0 for equal values", () => {
    expect(compareValues(5, 5)).toBe(0);
  });
  it("sorts null / undefined last", () => {
    expect(compareValues(null, 5)).toBe(1);
    expect(compareValues(5, undefined)).toBe(-1);
    expect(compareValues(undefined, null)).toBe(1);
  });
  it("compares numbers numerically", () => {
    expect(compareValues(2, 10)).toBeLessThan(0);
  });
  it("compares non-numbers as strings", () => {
    expect(compareValues("apple", "banana")).toBeLessThan(0);
    expect(compareValues(true, false)).not.toBe(0);
  });
});

describe("sortRows", () => {
  const rows = [
    { id: "a", n: 3 },
    { id: "b", n: 1 },
    { id: "c", n: 2 },
  ];

  it("sorts ascending without mutating the input", () => {
    const out = sortRows(rows, (r) => r.n, "asc");
    expect(out.map((r) => r.id)).toEqual(["b", "c", "a"]);
    expect(rows[0]?.id).toBe("a");
  });

  it("sorts descending", () => {
    expect(sortRows(rows, (r) => r.n, "desc").map((r) => r.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });

  it("is stable for equal keys", () => {
    const equal = [
      { id: "a", n: 1 },
      { id: "b", n: 1 },
      { id: "c", n: 1 },
    ];
    expect(sortRows(equal, (r) => r.n, "asc").map((r) => r.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
    expect(sortRows(equal, (r) => r.n, "desc").map((r) => r.id)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("keeps null/undefined values last in BOTH directions", () => {
    const withNulls = [
      { id: "a", n: 2 as number | null },
      { id: "b", n: null },
      { id: "c", n: 1 },
      { id: "d", n: undefined as number | null | undefined },
    ];
    // ascending: values asc, nullish last (stable among themselves)
    expect(sortRows(withNulls, (r) => r.n ?? null, "asc").map((r) => r.id)).toEqual(
      ["c", "a", "b", "d"]
    );
    // descending: values desc, nullish STILL last (must not flip to top)
    expect(
      sortRows(withNulls, (r) => r.n ?? null, "desc").map((r) => r.id)
    ).toEqual(["a", "c", "b", "d"]);
  });
});
