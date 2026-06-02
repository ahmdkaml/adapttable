import { describe, expect, it } from "vitest";

import { computePagination } from "./paginationMath";

describe("computePagination", () => {
  it("computes pages and range for a full set", () => {
    expect(computePagination({ page: 1, limit: 25, total: 75 })).toEqual({
      totalPages: 3,
      safePage: 1,
      fromIndex: 1,
      toIndex: 25,
    });
  });

  it("computes the partial last page range", () => {
    expect(computePagination({ page: 3, limit: 25, total: 60 })).toEqual({
      totalPages: 3,
      safePage: 3,
      fromIndex: 51,
      toIndex: 60,
    });
  });

  it("clamps an over-range page to the last", () => {
    const info = computePagination({ page: 99, limit: 10, total: 25 });
    expect(info.safePage).toBe(3);
    expect(info.totalPages).toBe(3);
  });

  it("returns a 0 range and 1 page for an empty set", () => {
    expect(computePagination({ page: 1, limit: 25, total: 0 })).toEqual({
      totalPages: 1,
      safePage: 1,
      fromIndex: 0,
      toIndex: 0,
    });
  });

  it("guards against a non-positive limit", () => {
    const info = computePagination({ page: 1, limit: 0, total: 5 });
    expect(info.totalPages).toBe(5);
  });

  it("never yields NaN for non-finite inputs", () => {
    for (const input of [
      { page: Number.NaN, limit: 10, total: 50 },
      { page: 1, limit: Number.NaN, total: 50 },
      { page: 1, limit: 10, total: Number.NaN },
      { page: Infinity, limit: 10, total: 50 },
    ]) {
      const info = computePagination(input);
      for (const v of Object.values(info)) {
        expect(Number.isFinite(v)).toBe(true);
      }
      expect(info.safePage).toBeGreaterThanOrEqual(1);
      expect(info.safePage).toBeLessThanOrEqual(info.totalPages);
    }
  });
});
