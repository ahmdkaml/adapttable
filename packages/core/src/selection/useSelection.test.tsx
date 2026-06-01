import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useSelection } from "./useSelection";

interface Row {
  id: string;
}
const rows: Row[] = [{ id: "a" }, { id: "b" }, { id: "c" }];
const getId = (r: Row) => r.id;

describe("useSelection", () => {
  it("starts empty with headerState none", () => {
    const { result } = renderHook(() => useSelection({ rows, getId }));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.headerState).toBe("none");
  });

  it("toggles a single id on and off", () => {
    const { result } = renderHook(() => useSelection({ rows, getId }));
    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.headerState).toBe("some");
    act(() => result.current.toggle("a"));
    expect(result.current.isSelected("a")).toBe(false);
    expect(result.current.headerState).toBe("none");
  });

  it("toggleAll selects all visible, then clears on a second call", () => {
    const { result } = renderHook(() => useSelection({ rows, getId }));
    act(() => result.current.toggleAll());
    expect(result.current.selectedCount).toBe(3);
    expect(result.current.headerState).toBe("all");
    act(() => result.current.toggleAll());
    expect(result.current.selectedCount).toBe(0);
  });

  it("clear empties the selection", () => {
    const { result } = renderHook(() => useSelection({ rows, getId }));
    act(() => result.current.toggle("a"));
    act(() => result.current.clear());
    expect(result.current.selectedCount).toBe(0);
  });

  it("clears the selection when resetKey changes (but not on mount)", () => {
    const { result, rerender } = renderHook(
      ({ k }) => useSelection({ rows, getId, resetKey: k }),
      { initialProps: { k: "page1" } }
    );
    act(() => result.current.toggle("a"));
    expect(result.current.selectedCount).toBe(1);
    rerender({ k: "page2" });
    expect(result.current.selectedCount).toBe(0);
  });

  it("does not thrash state when resetKey is unchanged and selection is empty", () => {
    const { result, rerender } = renderHook(
      ({ k }) => useSelection({ rows, getId, resetKey: k }),
      { initialProps: { k: "same" } }
    );
    const before = result.current.selectedIds;
    rerender({ k: "same" });
    expect(result.current.selectedIds).toBe(before);
  });
});
