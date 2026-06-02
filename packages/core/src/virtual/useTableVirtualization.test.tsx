import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  resolveVirtualRows,
  useTableVirtualization,
  virtualColumnSpan,
} from "./useTableVirtualization";

vi.mock("@tanstack/react-virtual", () => ({
  useWindowVirtualizer: vi.fn(),
}));

interface Row {
  id: string;
  name: string;
}

const rows: Row[] = Array.from({ length: 5 }, (_, i) => ({
  id: String(i),
  name: `Row ${i}`,
}));

const rowKey = (row: Row) => row.id;

describe("useTableVirtualization", () => {
  beforeEach(() => {
    vi.mocked(useWindowVirtualizer).mockReturnValue({
      getVirtualItems: () => [],
      getTotalSize: () => 0,
      measureElement: vi.fn(),
      options: { scrollMargin: 0 },
    } as unknown as ReturnType<typeof useWindowVirtualizer>);
  });

  it("returns every row when virtualization is disabled", () => {
    const { result } = renderHook(() =>
      useTableVirtualization({
        rows,
        rowKey,
        enabled: false,
      })
    );

    expect(result.current.enabled).toBe(false);
    expect(result.current.rows.map((entry) => entry.row.id)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
    ]);
    expect(result.current.paddingTop).toBe(0);
    expect(result.current.paddingBottom).toBe(0);
    expect(result.current.measureElement).toBeUndefined();
  });

  it("materializes only virtual rows and computes spacer padding", () => {
    const measureElement = vi.fn();
    vi.mocked(useWindowVirtualizer).mockReturnValue({
      getVirtualItems: () => [
        { index: 1, key: "v-1", start: 40, end: 80 },
        { index: 2, key: "v-2", start: 80, end: 120 },
      ],
      getTotalSize: () => 240,
      measureElement,
      options: { scrollMargin: 10 },
    } as unknown as ReturnType<typeof useWindowVirtualizer>);

    const { result } = renderHook(() =>
      useTableVirtualization({
        rows,
        rowKey,
        enabled: true,
        estimateSize: 40,
        overscan: 3,
        scrollMargin: 10,
      })
    );

    expect(result.current.enabled).toBe(true);
    expect(result.current.rows.map((entry) => entry.row.id)).toEqual([
      "1",
      "2",
    ]);
    expect(result.current.rows.map((entry) => entry.index)).toEqual([1, 2]);
    expect(result.current.paddingTop).toBe(30);
    expect(result.current.paddingBottom).toBe(130);
    expect(result.current.measureElement).toBe(measureElement);
    expect(useWindowVirtualizer).toHaveBeenCalledWith(
      expect.objectContaining({
        count: rows.length,
        enabled: true,
        estimateSize: expect.any(Function),
        overscan: 3,
        scrollMargin: 10,
      })
    );
  });

  it("falls back to every row before the virtualizer has a measured window", () => {
    vi.mocked(useWindowVirtualizer).mockReturnValue({
      getVirtualItems: () => [],
      getTotalSize: () => 0,
      measureElement: vi.fn(),
      options: { scrollMargin: 0 },
    } as unknown as ReturnType<typeof useWindowVirtualizer>);

    const { result } = renderHook(() =>
      useTableVirtualization({
        rows,
        rowKey,
        enabled: true,
        estimateSize: 40,
      })
    );

    expect(result.current.enabled).toBe(false);
    expect(result.current.rows.map((entry) => entry.row.id)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("calls onEndReached when the virtual slice reaches the final row", () => {
    const onEndReached = vi.fn();
    vi.mocked(useWindowVirtualizer).mockReturnValue({
      getVirtualItems: () => [{ index: 4, key: "v-4", start: 160, end: 200 }],
      getTotalSize: () => 200,
      measureElement: vi.fn(),
      options: { scrollMargin: 0 },
    } as unknown as ReturnType<typeof useWindowVirtualizer>);

    renderHook(() =>
      useTableVirtualization({
        rows,
        rowKey,
        enabled: true,
        estimateSize: 40,
        onEndReached,
      })
    );

    expect(onEndReached).toHaveBeenCalledTimes(1);
  });

  it("resolves fallback render entries when no virtual entries are provided", () => {
    expect(resolveVirtualRows(rows, rowKey).map((entry) => entry.key)).toEqual([
      "0",
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("uses provided virtual entries unchanged", () => {
    const entry = { row: rows[1]!, index: 1, key: "custom" };
    expect(resolveVirtualRows(rows, rowKey, [entry])).toEqual([entry]);
  });

  it("computes table spacer column spans", () => {
    expect(virtualColumnSpan(3, false, false)).toBe(3);
    expect(virtualColumnSpan(3, true, true)).toBe(5);
  });
});
