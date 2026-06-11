import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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

describe("controlled selection", () => {
  const rows = [{ id: "a" }, { id: "b" }];
  const getId = (r: { id: string }) => r.id;

  it("reads from the controlled value and routes changes to onChange", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useSelection({ rows, getId, selected: ["a"], onChange })
    );
    expect(result.current.isSelected("a")).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    act(() => result.current.toggle("b"));
    // The hook does NOT mutate itself — it asks the parent.
    expect(onChange).toHaveBeenCalledWith(["a", "b"]);
    expect(result.current.isSelected("b")).toBe(false);
    act(() => result.current.toggle("a"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("toggleAll and clear go through onChange in controlled mode", () => {
    const onChange = vi.fn();
    const { result } = renderHook(() =>
      useSelection({ rows, getId, selected: [], onChange })
    );
    act(() => result.current.toggleAll());
    expect(onChange).toHaveBeenLastCalledWith(["a", "b"]);
    act(() => result.current.clear());
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("a resetKey change requests a clear from the parent", () => {
    const onChange = vi.fn();
    const { rerender } = renderHook(
      ({ resetKey }) =>
        useSelection({ rows, getId, resetKey, selected: ["a"], onChange }),
      { initialProps: { resetKey: "k1" } }
    );
    rerender({ resetKey: "k2" });
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("a resetKey change with an already-empty selection asks nothing", () => {
    const onChange = vi.fn();
    const { rerender } = renderHook(
      ({ resetKey }) =>
        useSelection({ rows, getId, resetKey, selected: [], onChange }),
      { initialProps: { resetKey: "k1" } }
    );
    rerender({ resetKey: "k2" });
    expect(onChange).not.toHaveBeenCalled();
  });

  it("toggle identity is permanently stable and never computes from a stale set", () => {
    // A memoized row holds the FIRST render's toggle; with parent-applied
    // controlled updates, sequential toggles must accumulate, not drop.
    let applied: string[] = [];
    const onChange = (ids: string[]) => {
      applied = ids;
      rerender({ selected: ids });
    };
    const { result, rerender } = renderHook(
      ({ selected }) => useSelection({ rows, getId, selected, onChange }),
      { initialProps: { selected: [] as string[] } }
    );
    const heldToggle = result.current.toggle;
    act(() => heldToggle("a"));
    expect(applied).toEqual(["a"]);
    // The held (first-render) toggle must see the updated set.
    act(() => heldToggle("b"));
    expect(applied).toEqual(["a", "b"]);
    expect(result.current.toggle).toBe(heldToggle);
  });
});
