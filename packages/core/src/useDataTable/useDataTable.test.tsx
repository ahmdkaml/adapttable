import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { useFrontendData } from "../source/useFrontendData";
import type { BulkAction, ColumnDef } from "../types";
import { createMemoryAdapter } from "../url/adapter";
import { useDataTable, type UseDataTableOptions } from "./useDataTable";

interface Row {
  id: string;
  name: string;
  city: string;
}

const ROWS: Row[] = [
  { id: "a", name: "Alice", city: "Dubai" },
  { id: "b", name: "Bob", city: "Riyadh" },
];

const cols: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "city", header: "City", accessor: (r) => r.city, align: "end" },
];

function mount(
  initial = "",
  opts: Partial<UseDataTableOptions<Row>> = {},
  frontendOpts: { paginationMode?: "paged" | "infinite" } = {}
) {
  const adapter = createMemoryAdapter(initial);
  const view = renderHook(() => {
    const source = useFrontendData<Row>({
      data: ROWS,
      adapter,
      columns: cols,
      paginationMode: frontendOpts.paginationMode ?? "paged",
    });
    return useDataTable<Row>({
      source,
      columns: cols,
      rowKey: (r) => r.id,
      ...opts,
    });
  });
  return { adapter, ...view };
}

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe("useDataTable", () => {
  it("exposes rows, columns, labels, and pagination", () => {
    const { result } = mount();
    expect(result.current.rows.map((r) => r.id)).toEqual(["a", "b"]);
    expect(result.current.columns).toHaveLength(2);
    expect(result.current.labels.search).toBe("Search");
    expect(result.current.pagination.totalPages).toBe(1);
    expect(result.current.isEmpty).toBe(false);
  });

  it("merges label overrides", () => {
    const { result } = mount("", { labels: { search: "Buscar" } });
    expect(result.current.labels.search).toBe("Buscar");
  });

  it("filters columns by layout (mobile drops hideOnDesktop-aware set)", () => {
    const mobileCols: ColumnDef<Row>[] = [
      ...cols,
      { key: "x", header: "X", hideOnMobile: true },
    ];
    const { result } = mount("", { columns: mobileCols, isMobile: true });
    expect(result.current.columns.map((c) => c.key)).toEqual([
      "name",
      "city",
      "x",
    ]);
  });

  it("toggleSort cycles asc → desc → cleared through the source", () => {
    const { result, adapter } = mount();
    act(() => result.current.toggleSort("name"));
    expect(adapter.getSearch()).toContain("sortDir=asc");
    act(() => result.current.toggleSort("name"));
    expect(adapter.getSearch()).toContain("sortDir=desc");
    act(() => result.current.toggleSort("name"));
    expect(adapter.getSearch()).not.toContain("sortBy");
  });

  it("debounces the search input and commits to the source", () => {
    const { result, adapter } = mount();
    act(() => result.current.setSearchValue("ali"));
    expect(adapter.getSearch()).not.toContain("q=ali");
    act(() => vi.advanceTimersByTime(300));
    expect(adapter.getSearch()).toContain("q=ali");
  });

  it("derives filter chips and an active count from filterLabels", () => {
    const { result } = mount("f_status=Active,Planned", {
      columns: cols,
      filterLabels: { status: (v) => `Status: ${v}` },
    });
    // status isn't an array key here, so it's a single scalar chip.
    expect(result.current.activeFilterCount).toBeGreaterThan(0);
    expect(result.current.filterChips[0]?.label).toContain("Status:");
  });

  it("enables selection only when bulk actions are configured", () => {
    const noBulk = mount();
    expect(noBulk.result.current.selection).toBeNull();

    const bulkActions: BulkAction[] = [
      { key: "del", label: "Delete", onClick: vi.fn() },
    ];
    const withBulk = mount("", { bulkActions });
    expect(withBulk.result.current.selection).not.toBeNull();
    act(() => withBulk.result.current.selection?.toggleAll());
    expect(withBulk.result.current.selection?.selectedCount).toBe(2);
  });

  describe("prop-getters", () => {
    it("getTableProps carries role, dir and aria-label", () => {
      const { result } = mount("", { dir: "rtl", tableLabel: "People" });
      const props = result.current.getTableProps();
      expect(props.role).toBe("table");
      expect(props.dir).toBe("rtl");
      expect(props["aria-label"]).toBe("People");
    });

    it("getHeaderCellProps reports aria-sort and alignment", () => {
      const { result } = mount("sortBy=name&sortDir=asc");
      const sorted = result.current.getHeaderCellProps(cols[0]!);
      expect(sorted["aria-sort"]).toBe("ascending");
      const plain = result.current.getHeaderCellProps(cols[1]!);
      expect(plain["aria-sort"]).toBeUndefined();
      expect((plain.style as { textAlign: string }).textAlign).toBe("end");
    });

    it("getHeaderCellProps reports 'none' for an unsorted sortable column", () => {
      const { result } = mount();
      expect(result.current.getHeaderCellProps(cols[0]!)["aria-sort"]).toBe(
        "none"
      );
    });

    it("getSortButtonProps fires toggleSort and disables non-sortable", () => {
      const { result, adapter } = mount();
      const props = result.current.getSortButtonProps(cols[0]!);
      act(() => (props.onClick as () => void)());
      expect(adapter.getSearch()).toContain("sortBy=name");

      const disabled = result.current.getSortButtonProps(cols[1]!);
      expect(disabled.disabled).toBe(true);
      act(() => (disabled.onClick as () => void)());
      expect(adapter.getSearch()).not.toContain("sortBy=city");
    });

    it("getRowProps sets aria-selected only when selection is active", () => {
      const { result } = mount("", {
        bulkActions: [{ key: "d", label: "D", onClick: vi.fn() }],
      });
      const props = result.current.getRowProps(ROWS[0]!, 0);
      expect(props["aria-selected"]).toBe(false);
      expect(props["data-index"]).toBe(0);
    });

    it("getCellProps applies logical (RTL-aware) alignment", () => {
      const { result } = mount();
      const props = result.current.getCellProps(cols[1]!);
      expect((props.style as { textAlign: string }).textAlign).toBe("end");
    });

    it("getSearchInputProps wires value + onChange", () => {
      const { result } = mount();
      const props = result.current.getSearchInputProps();
      expect(props.type).toBe("search");
      act(() =>
        (props.onChange as (e: { currentTarget: { value: string } }) => void)({
          currentTarget: { value: "z" },
        })
      );
      expect(result.current.searchValue).toBe("z");
    });

    it("prop-getters merge caller overrides", () => {
      const { result } = mount();
      const extra = vi.fn();
      const props = result.current.getTableProps({
        className: "mine",
        onClick: extra,
      });
      expect(props.className).toBe("mine");
      (props.onClick as () => void)();
      expect(extra).toHaveBeenCalled();
    });
  });

  it("reports isEmpty when there are no rows", () => {
    const adapter = createMemoryAdapter("q=zzz");
    const { result } = renderHook(() => {
      const source = useFrontendData<Row>({
        data: ROWS,
        adapter,
        paginationMode: "paged",
      });
      return useDataTable<Row>({ source, columns: cols, rowKey: (r) => r.id });
    });
    expect(result.current.isEmpty).toBe(true);
  });
});
