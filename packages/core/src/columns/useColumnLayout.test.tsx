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
});
