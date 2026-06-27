import { describe, expect, it } from "vitest";

import { logicalAlign, sortArrow } from "./display";

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
