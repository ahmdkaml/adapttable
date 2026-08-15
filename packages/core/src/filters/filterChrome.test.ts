import { describe, expect, it } from "vitest";

import { resolveFilterMode } from "./filterChrome";

describe("resolveFilterMode", () => {
  it("defaults to the popover", () => {
    expect(resolveFilterMode()).toBe("popover");
    expect(resolveFilterMode(undefined, false)).toBe("popover");
  });

  it("treats headerFilters as header mode", () => {
    expect(resolveFilterMode(undefined, true)).toBe("header");
    expect(resolveFilterMode("popover", true)).toBe("header");
    expect(resolveFilterMode("drawer", true)).toBe("header");
  });

  it("honours an explicit mode when headerFilters is off", () => {
    expect(resolveFilterMode("drawer")).toBe("drawer");
    expect(resolveFilterMode("header")).toBe("header");
    expect(resolveFilterMode("popover")).toBe("popover");
  });
});
