import { describe, expect, it } from "vitest";

import { PAGE_SIZE_OPTIONS, pageSizeOptions } from "./constants";

describe("pageSizeOptions", () => {
  it("returns the standard options unchanged when the limit is one of them", () => {
    const result = pageSizeOptions(25);
    expect(result).toEqual([...PAGE_SIZE_OPTIONS]);
  });

  it("prepends an off-list limit so the selector never goes blank", () => {
    expect(pageSizeOptions(15)).toEqual([15, ...PAGE_SIZE_OPTIONS]);
  });

  it("accepts a custom set of standard sizes", () => {
    expect(pageSizeOptions(5, [20, 40])).toEqual([5, 20, 40]);
    expect(pageSizeOptions(20, [20, 40])).toEqual([20, 40]);
  });
});
