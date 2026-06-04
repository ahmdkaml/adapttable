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
});
