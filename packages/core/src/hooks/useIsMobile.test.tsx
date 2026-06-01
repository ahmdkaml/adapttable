import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MOBILE_MEDIA_QUERY,
  resolvePaginationMode,
  useIsMobile,
} from "./useIsMobile";

afterEach(() => vi.unstubAllGlobals());

describe("resolvePaginationMode", () => {
  it("returns a non-auto mode unchanged", () => {
    expect(resolvePaginationMode("paged", true)).toBe("paged");
    expect(resolvePaginationMode("infinite", false)).toBe("infinite");
  });

  it("resolves auto to infinite on mobile and paged on desktop", () => {
    expect(resolvePaginationMode("auto", true)).toBe("infinite");
    expect(resolvePaginationMode("auto", false)).toBe("paged");
  });
});

describe("useIsMobile", () => {
  it("reflects the mobile media query", () => {
    const matchMedia = vi.fn((q: string) => ({
      matches: q === MOBILE_MEDIA_QUERY,
      media: q,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    }));
    vi.stubGlobal("matchMedia", matchMedia);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });
});
