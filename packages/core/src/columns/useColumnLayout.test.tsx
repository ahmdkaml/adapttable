import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "../types";
import { useColumnLayout } from "./useColumnLayout";

interface Row {
  id: string;
}
const columns: ColumnDef<Row>[] = [
  { key: "a", header: "A", accessor: (r) => r.id },
  { key: "b", header: "B", accessor: (r) => r.id },
  { key: "c", header: "C", accessor: (r) => r.id },
];
const keys = (cols: ColumnDef<Row>[]) => cols.map((c) => c.key);

describe("useColumnLayout", () => {
  it("returns all columns in declared order by default", () => {
    const { result } = renderHook(() => useColumnLayout({ columns }));
    expect(keys(result.current.visibleColumns)).toEqual(["a", "b", "c"]);
  });

  it("hides and shows a column (uncontrolled)", () => {
    const { result } = renderHook(() => useColumnLayout({ columns }));
    act(() => result.current.toggleVisible("b"));
    expect(keys(result.current.visibleColumns)).toEqual(["a", "c"]);
    expect(result.current.isHidden("b")).toBe(true);
    act(() => result.current.setHidden("b", false));
    expect(keys(result.current.visibleColumns)).toEqual(["a", "b", "c"]);
  });

  it("applies an explicit order, appending unlisted columns", () => {
    const { result } = renderHook(() =>
      useColumnLayout({
        columns,
        defaultLayout: { order: ["c", "a"] },
      })
    );
    expect(keys(result.current.visibleColumns)).toEqual(["c", "a", "b"]);
  });

  it("reset restores all columns and declared order", () => {
    const { result } = renderHook(() =>
      useColumnLayout({ columns, defaultLayout: { hidden: ["a"] } })
    );
    expect(keys(result.current.visibleColumns)).toEqual(["b", "c"]);
    act(() => result.current.reset());
    expect(keys(result.current.visibleColumns)).toEqual(["a", "b", "c"]);
  });

  it("is controlled: mutations call onLayoutChange and do not self-update", () => {
    const onLayoutChange = vi.fn();
    const { result } = renderHook(() =>
      useColumnLayout({
        columns,
        layout: { hidden: [], order: [], pinned: {}, widths: {} },
        onLayoutChange,
      })
    );
    act(() => result.current.toggleVisible("a"));
    expect(onLayoutChange).toHaveBeenCalledWith(
      expect.objectContaining({ hidden: ["a"] })
    );
    // Controlled value didn't change, so the rendered columns are unchanged
    // until the parent passes a new `layout`.
    expect(keys(result.current.visibleColumns)).toEqual(["a", "b", "c"]);
  });

  it("ignores an unknown key in the order", () => {
    const { result } = renderHook(() =>
      useColumnLayout({ columns, defaultLayout: { order: ["zzz", "b"] } })
    );
    expect(keys(result.current.visibleColumns)).toEqual(["b", "a", "c"]);
  });

  it("moves a column to a new index", () => {
    const { result } = renderHook(() => useColumnLayout({ columns }));
    act(() => result.current.move("a", 2));
    expect(keys(result.current.visibleColumns)).toEqual(["b", "c", "a"]);
  });

  it("pins columns and computes sticky offsets from widths", () => {
    const { result } = renderHook(() =>
      useColumnLayout({
        columns,
        defaultLayout: { widths: { a: 100, b: 120 } },
      })
    );
    act(() => result.current.setPinned("a", "left"));
    act(() => result.current.setPinned("b", "left"));
    // 'a' is first left-pinned → inset 0; 'b' follows → inset = width(a) = 100.
    expect(result.current.pinOffset("a")).toEqual({ side: "left", inset: 0 });
    expect(result.current.pinOffset("b")).toEqual({ side: "left", inset: 100 });
    expect(result.current.pinOffset("c")).toBeUndefined();
    act(() => result.current.setPinned("a", undefined));
    expect(result.current.pinOffset("a")).toBeUndefined();
  });

  it("right-pin offset sums widths of right-pinned columns after it", () => {
    const { result } = renderHook(() =>
      useColumnLayout({
        columns,
        defaultLayout: {
          pinned: { b: "right", c: "right" },
          widths: { c: 80 },
        },
      })
    );
    // 'b' is before 'c' (both right-pinned) → inset = width(c) = 80.
    expect(result.current.pinOffset("b")).toEqual({ side: "right", inset: 80 });
    expect(result.current.pinOffset("c")).toEqual({ side: "right", inset: 0 });
  });

  it("sets and clears a column width", () => {
    const onLayoutChange = vi.fn();
    const { result } = renderHook(() =>
      useColumnLayout({ columns, onLayoutChange })
    );
    act(() => result.current.setWidth("a", 200));
    expect(result.current.state.widths.a).toBe(200);
    act(() => result.current.setWidth("a", undefined));
    expect(result.current.state.widths.a).toBeUndefined();
  });
});
