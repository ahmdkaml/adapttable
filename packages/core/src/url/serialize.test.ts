import { describe, expect, it } from "vitest";

import type { FilterValue } from "../types";
import {
  isEmptyFilterValue,
  readExtra,
  readLimit,
  readPage,
  readSortDir,
  writeExtra,
} from "./serialize";

const ps = (s: string) => new URLSearchParams(s);

describe("readPage", () => {
  it("reads a valid page", () => {
    expect(readPage(ps("page=3"), 1)).toBe(3);
  });
  it("falls back when missing", () => {
    expect(readPage(ps(""), 1)).toBe(1);
  });
  it("falls back on non-positive / non-numeric", () => {
    expect(readPage(ps("page=0"), 1)).toBe(1);
    expect(readPage(ps("page=abc"), 2)).toBe(2);
  });
});

describe("readLimit", () => {
  it("reads a valid limit", () => {
    expect(readLimit(ps("limit=50"), 25)).toBe(50);
  });
  it("falls back when out of range", () => {
    expect(readLimit(ps("limit=9999"), 25)).toBe(25);
    expect(readLimit(ps("limit=-5"), 25)).toBe(25);
  });
  it("falls back when absent", () => {
    expect(readLimit(ps(""), 10)).toBe(10);
  });
});

describe("readSortDir", () => {
  it("reads asc / desc", () => {
    expect(readSortDir(ps("sortDir=asc"))).toBe("asc");
    expect(readSortDir(ps("sortDir=desc"))).toBe("desc");
  });
  it("returns undefined for invalid / missing", () => {
    expect(readSortDir(ps("sortDir=sideways"))).toBeUndefined();
    expect(readSortDir(ps(""))).toBeUndefined();
  });
});

describe("readExtra", () => {
  it("reads plain string filters", () => {
    expect(readExtra(ps("f_status=Active"), [], [])).toEqual({
      status: "Active",
    });
  });
  it("parses number-keyed filters as numbers (including 0)", () => {
    expect(readExtra(ps("f_count=0"), ["count"], [])).toEqual({ count: 0 });
  });
  it("parses array-keyed filters as trimmed, non-empty arrays", () => {
    expect(readExtra(ps("f_tags=a, b ,,c"), [], ["tags"])).toEqual({
      tags: ["a", "b", "c"],
    });
  });
  it("drops empty array filters", () => {
    expect(readExtra(ps("f_tags=,"), [], ["tags"])).toEqual({});
  });
  it("ignores empty values and non-prefixed keys", () => {
    expect(readExtra(ps("f_x=&y=2"), [], [])).toEqual({});
  });
  it("ignores invalid numbers for number keys", () => {
    expect(readExtra(ps("f_count=abc"), ["count"], [])).toEqual({});
  });
});

describe("isEmptyFilterValue", () => {
  it("treats undefined / empty string / empty array as empty", () => {
    expect(isEmptyFilterValue(undefined)).toBe(true);
    expect(isEmptyFilterValue("")).toBe(true);
    expect(isEmptyFilterValue([])).toBe(true);
  });
  it("treats real values as non-empty", () => {
    expect(isEmptyFilterValue("x")).toBe(false);
    expect(isEmptyFilterValue(0)).toBe(false);
    expect(isEmptyFilterValue(["a"])).toBe(false);
  });
});

describe("writeExtra", () => {
  it("writes scalars and arrays, dropping empties", () => {
    const p = ps("");
    writeExtra(p, { status: "Active", tags: ["a", "b"], cleared: "" });
    expect(p.get("f_status")).toBe("Active");
    expect(p.get("f_tags")).toBe("a,b");
    expect(p.has("f_cleared")).toBe(false);
  });
  it("strips existing f_ params not present in the new bag", () => {
    const p = ps("f_old=1&keep=yes");
    writeExtra(p, { fresh: "2" });
    expect(p.has("f_old")).toBe(false);
    expect(p.get("f_fresh")).toBe("2");
    expect(p.get("keep")).toBe("yes");
  });
  it("clears all f_ params when given an empty bag", () => {
    const p = ps("f_a=1&f_b=2");
    writeExtra(p, {});
    expect(p.toString()).toBe("");
  });
});

describe("extra-filter round-trips", () => {
  // Simulate the real URLSearchParams encode/decode the adapter performs.
  const roundTrip = (extra: Record<string, FilterValue>, arrayKeys: string[]) => {
    const p = new URLSearchParams();
    writeExtra(p, extra);
    return readExtra(new URLSearchParams(p.toString()), [], arrayKeys);
  };

  it("round-trips array values that contain the comma delimiter", () => {
    expect(roundTrip({ tags: ["a,b", "c"] }, ["tags"])).toEqual({
      tags: ["a,b", "c"],
    });
  });

  it("round-trips array values with spaces, unicode, and reserved chars", () => {
    expect(roundTrip({ tags: ["a & b", "café 🚀", "x=y"] }, ["tags"])).toEqual({
      tags: ["a & b", "café 🚀", "x=y"],
    });
  });

  it("tolerates a malformed percent-escape in a hand-edited array param", () => {
    // A lone '%' would make decodeURIComponent throw; safeDecode falls back.
    expect(readExtra(ps("f_tags=a,100%,c"), [], ["tags"])).toEqual({
      tags: ["a", "100%", "c"],
    });
  });
});
