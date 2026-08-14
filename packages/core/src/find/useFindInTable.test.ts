/**
 * The find bar's state.
 */
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import { useFindFocus, useFindInTable } from "./useFindInTable";

interface Row {
  id: string;
  name: string;
}
const ROWS: Row[] = [
  { id: "1", name: "Ada" },
  { id: "2", name: "Alan" },
  { id: "3", name: "Grace" },
];
const COLUMNS: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name },
];

const setup = (enabled = true) =>
  renderHook(() =>
    useFindInTable<Row>({ enabled, rows: ROWS, columns: COLUMNS })
  );

describe("useFindInTable", () => {
  it("searches nothing until the bar is open", () => {
    const { result } = setup();
    act(() => {
      result.current.setQuery("a");
    });
    expect(result.current.matches).toHaveLength(0);
    act(() => {
      result.current.setOpen(true);
    });
    expect(result.current.matches).toHaveLength(3);
  });

  it("lands on the first hit and walks forward, wrapping", () => {
    const { result } = setup();
    act(() => {
      result.current.setOpen(true);
      result.current.setQuery("a");
    });
    expect(result.current.current).toEqual({ row: 0, col: 0 });
    act(() => {
      result.current.next();
    });
    expect(result.current.current).toEqual({ row: 1, col: 0 });
    act(() => {
      result.current.next();
      result.current.next();
    });
    expect(result.current.current).toEqual({ row: 0, col: 0 });
  });

  it("walks backwards too", () => {
    const { result } = setup();
    act(() => {
      result.current.setOpen(true);
      result.current.setQuery("a");
    });
    act(() => {
      result.current.previous();
    });
    expect(result.current.index).toBe(2);
  });

  it("starts the walk again on a new query", () => {
    // Staying on hit 9 of the last search would land the user somewhere
    // unrelated to what they just typed.
    const { result } = setup();
    act(() => {
      result.current.setOpen(true);
      result.current.setQuery("a");
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.index).toBe(1);
    act(() => {
      result.current.setQuery("gr");
    });
    expect(result.current.index).toBe(0);
    expect(result.current.current).toEqual({ row: 2, col: 0 });
  });

  it("points at nothing when the query matches nothing", () => {
    const { result } = setup();
    act(() => {
      result.current.setOpen(true);
      result.current.setQuery("zzz");
    });
    expect(result.current.index).toBe(-1);
    expect(result.current.current).toBeNull();
  });

  it("clears the query when the bar closes", () => {
    const { result } = setup();
    act(() => {
      result.current.setOpen(true);
      result.current.setQuery("a");
      result.current.setOpen(false);
    });
    expect(result.current.query).toBe("");
    expect(result.current.matchKeys.size).toBe(0);
  });

  it("clamps the walk when a narrower query leaves fewer hits", () => {
    const { result } = setup();
    act(() => {
      result.current.setOpen(true);
      result.current.setQuery("a");
    });
    act(() => {
      result.current.next();
    });
    expect(result.current.index).toBe(1);
    act(() => {
      result.current.setQuery("ada");
    });
    expect(result.current.index).toBe(0);
  });

  it("opens the bar through openBar, the way Ctrl/Cmd+F does", () => {
    const { result } = setup();
    expect(result.current.open).toBe(false);
    act(() => {
      result.current.openBar?.();
    });
    expect(result.current.open).toBe(true);
  });

  it("focuses and selects the current match", () => {
    const focusCell = vi.fn();
    const selectRange = vi.fn();
    let current: { row: number; col: number } | null = null;
    const { rerender } = renderHook(() =>
      useFindFocus(current, focusCell, selectRange)
    );
    expect(focusCell).not.toHaveBeenCalled();
    current = { row: 1, col: 0 };
    rerender();
    expect(focusCell).toHaveBeenCalledWith({ row: 1, col: 0 });
    expect(selectRange).toHaveBeenCalledWith({
      anchor: { row: 1, col: 0 },
      head: { row: 1, col: 0 },
    });
  });

  it("stays shut when the feature is off", () => {
    const { result } = setup(false);
    act(() => {
      result.current.setOpen(true);
      result.current.setQuery("a");
    });
    expect(result.current.open).toBe(false);
    expect(result.current.matches).toHaveLength(0);
  });
});
