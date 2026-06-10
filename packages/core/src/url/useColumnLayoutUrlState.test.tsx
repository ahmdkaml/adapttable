import { act, renderHook } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { createMemoryAdapter } from "./adapter";
import { useColumnLayoutUrlState } from "./useColumnLayoutUrlState";

function renderWith(
  initial = "",
  options?: Parameters<typeof useColumnLayoutUrlState>[0]
) {
  const adapter = createMemoryAdapter(initial);
  const view = renderHook(() =>
    useColumnLayoutUrlState({ adapter, ...options })
  );
  return { adapter, ...view };
}

describe("useColumnLayoutUrlState", () => {
  it("hydrates from an empty snapshot with the default adapter", () => {
    window.history.replaceState(null, "", "/?colHide=email");
    function Probe() {
      const { layout } = useColumnLayoutUrlState();
      return <span>{`hidden-${layout.hidden.length}`}</span>;
    }
    // Server snapshot must match the server's empty store, not the live URL.
    expect(renderToString(<Probe />)).toContain("hidden-0");
    window.history.replaceState(null, "", "/");
  });

  it("reads the layout via the server snapshot during SSR", () => {
    const adapter = createMemoryAdapter("colHide=email");
    function Probe() {
      const { layout } = useColumnLayoutUrlState({ adapter });
      return <span>{layout.hidden.join(",")}</span>;
    }
    expect(renderToString(<Probe />)).toContain("email");
  });

  it("falls back to the default layout when the URL is empty", () => {
    const { result } = renderWith("", {
      defaultLayout: { hidden: ["email", "team"] },
    });
    expect(result.current.layout.hidden).toEqual(["email", "team"]);
  });

  it("prefers the URL layout over the default", () => {
    const { result } = renderWith("colHide=status", {
      defaultLayout: { hidden: ["email", "team"] },
    });
    expect(result.current.layout.hidden).toEqual(["status"]);
  });

  it("persists a new layout into the URL", () => {
    const { result, adapter } = renderWith("");
    act(() => {
      result.current.onLayoutChange({
        hidden: [],
        order: [],
        pinned: { person: "left" },
        widths: {},
      });
    });
    expect(adapter.getSearch()).toBe("colPin=person%3Aleft");
    expect(result.current.layout.pinned).toEqual({ person: "left" });
  });

  it("namespaces params by urlKey so tables do not collide", () => {
    const { result, adapter } = renderWith("", { urlKey: "left" });
    act(() => {
      result.current.onLayoutChange({
        hidden: ["email"],
        order: [],
        pinned: {},
        widths: {},
      });
    });
    expect(adapter.getSearch()).toContain("left.colHide=email");
  });

  it("keeps the layout local when disabled (no adapter)", () => {
    const { result } = renderHook(() =>
      useColumnLayoutUrlState({ enabled: false })
    );
    act(() => {
      result.current.onLayoutChange({
        hidden: ["team"],
        order: [],
        pinned: {},
        widths: {},
      });
    });
    expect(result.current.layout.hidden).toEqual(["team"]);
    expect(window.location.search).toBe("");
  });

  it("an explicitly emptied layout sticks instead of snapping back to the default", () => {
    // Unhiding the last default-hidden column empties the layout; deleting
    // every param would re-apply the default and instantly re-hide it.
    const { result } = renderWith("", { defaultLayout: { hidden: ["email"] } });
    expect(result.current.layout.hidden).toEqual(["email"]);
    act(() => {
      result.current.onLayoutChange({
        hidden: [],
        order: [],
        pinned: {},
        widths: {},
      });
    });
    expect(result.current.layout.hidden).toEqual([]);
  });

  it("drops all params when the layout returns to the exact default", () => {
    const { result, adapter } = renderWith("colHide=status", {
      defaultLayout: { hidden: ["email"] },
    });
    act(() => {
      result.current.onLayoutChange({
        hidden: ["email"],
        order: [],
        pinned: {},
        widths: {},
      });
    });
    expect(adapter.getSearch()).toBe("");
    expect(result.current.layout.hidden).toEqual(["email"]);
  });

  it("an emptied layout with no default leaves a clean URL", () => {
    const { result, adapter } = renderWith("colHide=email");
    act(() => {
      result.current.onLayoutChange({
        hidden: [],
        order: [],
        pinned: {},
        widths: {},
      });
    });
    expect(adapter.getSearch()).toBe("");
    expect(result.current.layout.hidden).toEqual([]);
  });
});
