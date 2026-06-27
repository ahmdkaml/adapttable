import { describe, expect, it } from "vitest";

import { PIN_Z } from "./columns/useColumnLayout";
import {
  logicalAlign,
  pinnedDataCellStyle,
  pinnedEdgeCellStyle,
  shallowEqualByKeys,
  sortArrow,
} from "./display";

describe("logicalAlign", () => {
  it("maps center and end, defaulting to start", () => {
    expect(logicalAlign("center")).toBe("center");
    expect(logicalAlign("end")).toBe("end");
    expect(logicalAlign("start")).toBe("start");
    expect(logicalAlign(undefined)).toBe("start");
  });
});

describe("sortArrow", () => {
  it("returns the ascending, descending, and unsorted glyphs", () => {
    expect(sortArrow("ascending")).toBe(" ↑");
    expect(sortArrow("descending")).toBe(" ↓");
    expect(sortArrow("none")).toBe(" ↕");
    expect(sortArrow(undefined)).toBe(" ↕");
  });
});

describe("pinnedDataCellStyle", () => {
  it("paints the background on a pinned style, passes undefined through", () => {
    const style = pinnedDataCellStyle(
      { side: "start", inset: 0 },
      PIN_Z.body,
      {},
      "navy"
    );
    expect(style?.background).toBe("navy");
    expect(pinnedDataCellStyle(undefined, 0, {}, "navy")).toBeUndefined();
  });
});

describe("pinnedEdgeCellStyle", () => {
  it("styles an active edge cell (+ shift) and skips an inactive one", () => {
    const shifted = pinnedEdgeCellStyle("start", true, PIN_Z.body, "navy", 12);
    expect(shifted?.background).toBe("navy");
    expect(shifted?.insetInlineStart).toBe(12);
    expect(pinnedEdgeCellStyle("start", false, 0, "navy")).toBeUndefined();
  });
});

describe("shallowEqualByKeys", () => {
  it("compares only the listed keys", () => {
    expect(shallowEqualByKeys(["a"], { a: 1, b: 2 }, { a: 1, b: 9 })).toBe(
      true
    );
    expect(shallowEqualByKeys(["a", "b"], { a: 1, b: 2 }, { a: 1, b: 9 })).toBe(
      false
    );
  });
});
