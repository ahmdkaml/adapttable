import { renderHook } from "@testing-library/react";
import { act } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  documentOffsetTop,
  measureWindowScrollMargin,
  useMeasuredWindowScrollMargin,
  virtualListElement,
} from "./windowScrollMargin";

function fakeRect(top: number): DOMRect {
  return {
    top,
    left: 0,
    right: 0,
    bottom: top,
    width: 0,
    height: 0,
    x: 0,
    y: top,
    toJSON: () => ({}),
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("virtualListElement", () => {
  it("finds a named tbody or cards list, otherwise the root", () => {
    const root = document.createElement("div");
    expect(virtualListElement(null)).toBeNull();
    expect(virtualListElement(root)).toBe(root);

    const cards = document.createElement("div");
    cards.setAttribute("data-adapttable-part", "cards");
    root.appendChild(cards);
    expect(virtualListElement(root)).toBe(cards);

    cards.remove();
    const body = document.createElement("div");
    body.setAttribute("data-adapttable-part", "tbody");
    root.appendChild(body);
    expect(virtualListElement(root)).toBe(body);
  });
});

describe("documentOffsetTop / measureWindowScrollMargin", () => {
  it("adds the viewport top to the window scroll", () => {
    const el = document.createElement("div");
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue(fakeRect(240));
    vi.spyOn(window, "scrollY", "get").mockReturnValue(40);
    expect(documentOffsetTop(el)).toBe(280);
  });

  it("never reports a negative offset", () => {
    const el = document.createElement("div");
    vi.spyOn(el, "getBoundingClientRect").mockReturnValue(fakeRect(-12));
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    expect(documentOffsetTop(el)).toBe(0);
  });

  it("reads the list node inside a root, or zero when nothing is mounted", () => {
    expect(measureWindowScrollMargin(null)).toBe(0);
    const root = document.createElement("div");
    const body = document.createElement("div");
    body.setAttribute("data-adapttable-part", "tbody");
    root.appendChild(body);
    vi.spyOn(body, "getBoundingClientRect").mockReturnValue(fakeRect(180));
    vi.spyOn(window, "scrollY", "get").mockReturnValue(20);
    expect(measureWindowScrollMargin(root)).toBe(200);
  });
});

describe("useMeasuredWindowScrollMargin", () => {
  it("stays at zero until a list is observed, then tracks its document Y", () => {
    const { result } = renderHook(() => useMeasuredWindowScrollMargin(true));
    expect(result.current.scrollMargin).toBe(0);

    const box = document.createElement("div");
    const body = document.createElement("div");
    body.setAttribute("data-adapttable-part", "tbody");
    box.appendChild(body);
    vi.spyOn(body, "getBoundingClientRect").mockReturnValue(fakeRect(320));
    vi.spyOn(window, "scrollY", "get").mockReturnValue(16);

    act(() => {
      result.current.observe(box);
    });
    expect(result.current.scrollMargin).toBe(336);
  });

  it("clears the margin when the list unmounts or measuring turns off", () => {
    const { result, rerender } = renderHook(
      ({ enabled }: { enabled: boolean }) =>
        useMeasuredWindowScrollMargin(enabled),
      { initialProps: { enabled: true } }
    );
    const box = document.createElement("div");
    vi.spyOn(box, "getBoundingClientRect").mockReturnValue(fakeRect(100));
    act(() => {
      result.current.observe(box);
    });
    expect(result.current.scrollMargin).toBe(100);

    act(() => {
      result.current.observe(null);
    });
    expect(result.current.scrollMargin).toBe(0);

    act(() => {
      result.current.observe(box);
    });
    rerender({ enabled: false });
    expect(result.current.scrollMargin).toBe(0);
  });
});
