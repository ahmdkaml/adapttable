import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useFrontendData } from "./source/useFrontendData";
import type { ColumnDef } from "./types";
import { createMemoryAdapter } from "./url/adapter";
import { useTableChrome } from "./useTableChrome";

interface Row {
  id: string;
  name: string;
}
const ROWS: Row[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];
const columns: ColumnDef<Row>[] = [{ key: "name", header: "Name" }];

function mount(
  initial = "",
  opts: {
    rows?: readonly Row[];
    isLoading?: boolean;
    isMobile?: boolean;
    extraChips?: { key: string; label: string; onRemove: () => void }[];
    filterLabels?: Record<string, (v: string) => string>;
    activeFilterCount?: number;
  } = {}
) {
  const adapter = createMemoryAdapter(initial);
  return renderHook(() => {
    const source = useFrontendData<Row>({
      data: opts.rows ?? ROWS,
      adapter,
      columns,
      paginationMode: "paged",
      isLoading: opts.isLoading,
    });
    return useTableChrome<Row>({
      source,
      columns,
      rowKey: (r) => r.id,
      isMobile: opts.isMobile,
      extraChips: opts.extraChips,
      filterLabels: opts.filterLabels,
      activeFilterCount: opts.activeFilterCount,
    });
  });
}

describe("useTableChrome", () => {
  it("resolves the desktop body and a paged footer with data", () => {
    const { result } = mount();
    expect(result.current.body).toBe("desktop");
    expect(result.current.isPaged).toBe(true);
    expect(result.current.showFooter).toBe(true);
    expect(result.current.isMobile).toBe(false);
  });

  it("reports the skeleton body while loading with no rows", () => {
    const { result } = mount("", { rows: [], isLoading: true });
    expect(result.current.body).toBe("skeleton");
    expect(result.current.showFooter).toBe(true);
  });

  it("reports the empty body when there are no rows", () => {
    const { result } = mount("", { rows: [] });
    expect(result.current.body).toBe("empty");
    expect(result.current.showFooter).toBe(false);
  });

  it("reports the mobile body when isMobile", () => {
    const { result } = mount("", { isMobile: true });
    expect(result.current.body).toBe("mobile");
  });

  it("merges label chips with extraChips and counts them", () => {
    const { result } = mount("f_status=Active", {
      filterLabels: { status: (v) => `Status: ${v}` },
      extraChips: [{ key: "x", label: "X", onRemove: vi.fn() }],
    });
    expect(result.current.mergedChips.map((c) => c.label)).toContain(
      "Status: Active"
    );
    expect(result.current.mergedChips.map((c) => c.label)).toContain("X");
    expect(result.current.activeFilterCount).toBe(
      result.current.mergedChips.length
    );
  });

  it("returns only extraChips when there are no label chips", () => {
    const { result } = mount("", {
      extraChips: [{ key: "x", label: "Only", onRemove: vi.fn() }],
    });
    expect(result.current.mergedChips.map((c) => c.label)).toEqual(["Only"]);
  });

  it("honours an explicit activeFilterCount override", () => {
    const { result } = mount("", { activeFilterCount: 7 });
    expect(result.current.activeFilterCount).toBe(7);
  });

  it("exposes the headless table and a getRowId", () => {
    const { result } = mount();
    expect(result.current.table.rows).toHaveLength(2);
    expect(result.current.getRowId(ROWS[0]!)).toBe("a");
    act(() => result.current.table.toggleSort("name"));
  });
});
