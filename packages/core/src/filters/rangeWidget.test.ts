import { describe, expect, it } from "vitest";

import { readRangeWidget, writeRangeWidget } from "./rangeWidget";

describe("readRangeWidget", () => {
  it("derives the operator from the persisted pair", () => {
    expect(readRangeWidget({}, "bMin", "bMax")).toEqual({
      op: undefined,
      a: "",
      b: "",
    });
    expect(readRangeWidget({ bMin: 5 }, "bMin", "bMax")).toEqual({
      op: "gte",
      a: "5",
      b: "",
    });
    expect(readRangeWidget({ bMax: "9" }, "bMin", "bMax")).toEqual({
      op: "lte",
      a: "",
      b: "9",
    });
    expect(readRangeWidget({ bMin: 2, bMax: 9 }, "bMin", "bMax")).toEqual({
      op: "between",
      a: "2",
      b: "9",
    });
    // Equal bounds collapse to the single-value Equal operator.
    expect(readRangeWidget({ bMin: "7", bMax: "7" }, "bMin", "bMax")).toEqual({
      op: "eq",
      a: "7",
      b: "",
    });
  });
});

describe("writeRangeWidget", () => {
  it("maps each operator onto the inclusive pair", () => {
    expect(writeRangeWidget("eq", "7", "", "lo", "hi")).toEqual({
      lo: "7",
      hi: "7",
    });
    expect(writeRangeWidget("gte", "5", "", "lo", "hi")).toEqual({
      lo: "5",
      hi: undefined,
    });
    expect(writeRangeWidget("lte", "9", "", "lo", "hi")).toEqual({
      lo: undefined,
      hi: "9",
    });
    expect(writeRangeWidget("between", "2", "9", "lo", "hi")).toEqual({
      lo: "2",
      hi: "9",
    });
  });

  it("clearing the operator or emptying values clears the pair", () => {
    expect(writeRangeWidget(undefined, "5", "9", "lo", "hi")).toEqual({
      lo: undefined,
      hi: undefined,
    });
    expect(writeRangeWidget("eq", "", "", "lo", "hi")).toEqual({
      lo: undefined,
      hi: undefined,
    });
    expect(writeRangeWidget("between", "2", "", "lo", "hi")).toEqual({
      lo: "2",
      hi: undefined,
    });
  });

  it("round-trips through readRangeWidget", () => {
    const extras = writeRangeWidget("between", "1", "4", "aMin", "aMax");
    expect(readRangeWidget(extras, "aMin", "aMax").op).toBe("between");
    const eq = writeRangeWidget("eq", "3", "", "aMin", "aMax");
    expect(readRangeWidget(eq, "aMin", "aMax")).toEqual({
      op: "eq",
      a: "3",
      b: "",
    });
  });
});
