import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "../types";
import { createMemoryAdapter } from "../url/adapter";
import { resetDevWarnings } from "../utils/devWarn";
import { useServerData } from "./useServerData";
import { useTableData } from "./useTableData";

interface Row {
  id: string;
  name: string;
  status: string;
  budget: number;
}

const ROWS: Row[] = [
  { id: "1", name: "Alice", status: "active", budget: 100 },
  { id: "2", name: "Bob", status: "blocked", budget: 900 },
  { id: "3", name: "Cara", status: "active", budget: 500 },
];

const columns: ColumnDef<Row>[] = [
  { key: "name" },
  { key: "status", filter: { type: "select" } },
];

beforeEach(() => resetDevWarnings());

describe("useTableData — frontend tier", () => {
  it("auto-filters rows from the declarative runtime (URL-restored)", () => {
    const adapter = createMemoryAdapter("f_status=active&f_budgetMin=300");
    const { result } = renderHook(() =>
      useTableData<Row>({
        data: ROWS,
        columns,
        filters: [{ key: "budget", type: "numberRange" }],
        adapter,
        paginationMode: "paged",
      })
    );
    // status=active AND budget>=300 → only Cara.
    expect(result.current.source.rows.map((r) => r.name)).toEqual(["Cara"]);
    // numberRange registered its keys, so the URL value parsed as a number.
    expect(result.current.source.extra.budgetMin).toBe(300);
  });

  it("AND-composes a user filterFn with the declarative predicate", () => {
    const adapter = createMemoryAdapter("f_status=active");
    const { result } = renderHook(() =>
      useTableData<Row>({
        data: ROWS,
        columns,
        adapter,
        paginationMode: "paged",
        filterFn: (row) => row.budget < 200,
      })
    );
    expect(result.current.source.rows.map((r) => r.name)).toEqual(["Alice"]);
  });

  it("exposes the merged runtime (defs, chips) for the adapters", () => {
    const adapter = createMemoryAdapter("");
    const { result } = renderHook(() =>
      useTableData<Row>({ data: ROWS, columns, adapter })
    );
    expect(result.current.runtime.defs.map((d) => d.key)).toEqual(["status"]);
    expect(result.current.runtime.filterLabels.status!("active")).toBe(
      "Status: active"
    );
  });
});

describe("useTableData — tier resolution", () => {
  it("a provided source wins, with a dev warning when data is also passed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const external = {
      rows: ROWS,
      total: 3,
      page: 1,
      limit: 8,
      search: "",
      sortBy: undefined,
      sortDir: undefined,
      extra: {},
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      error: null,
      paginationMode: "paged" as const,
      setPage: vi.fn(),
      setLimit: vi.fn(),
      setSort: vi.fn(),
      setSearch: vi.fn(),
      setExtra: vi.fn(),
      setExtras: vi.fn(),
      clearExtras: vi.fn(),
      clearAll: vi.fn(),
      fetchNextPage: vi.fn(),
      refetch: vi.fn(),
    };
    const { result } = renderHook(() =>
      useTableData<Row>({ source: external, data: ROWS, columns })
    );
    expect(result.current.source).toBe(external);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("using `source`")
    );
    warn.mockRestore();
  });

  it("warns when source is combined with onQueryChange too", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const adapter = createMemoryAdapter("");
    renderHook(() => {
      const { source } = useTableData<Row>({ data: ROWS, columns, adapter });
      return useTableData<Row>({
        source,
        onQueryChange: vi.fn(),
        columns,
        adapter,
      });
    });
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("using `source`")
    );
    warn.mockRestore();
  });

  it("warns when no tier is provided at all", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    renderHook(() =>
      useTableData<Row>({ columns, adapter: createMemoryAdapter("") })
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("no data tier provided")
    );
    warn.mockRestore();
  });
});

describe("useTableData / useServerData — server tier", () => {
  it("server mode with no rows yet starts empty and URL-enabled", () => {
    const onQueryChange = vi.fn();
    const adapter = createMemoryAdapter("");
    const { result } = renderHook(() =>
      useTableData<Row>({
        // No `data` yet (first fetch still out) — rows default to [].
        total: 0,
        loading: true,
        onQueryChange,
        columns,
        adapter,
        enabled: true,
      })
    );
    expect(result.current.source.rows).toEqual([]);
    expect(result.current.source.isLoading).toBe(true);
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it("emits the URL-restored query once on mount with an abort signal", () => {
    const onQueryChange = vi.fn();
    const adapter = createMemoryAdapter("q=ali&f_status=active&page=2");
    const { rerender } = renderHook(() =>
      useTableData<Row>({
        data: ROWS,
        total: 40,
        loading: false,
        onQueryChange,
        columns,
        adapter,
      })
    );
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    const [query, info] = onQueryChange.mock.calls[0]!;
    expect(query).toMatchObject({
      page: 2,
      search: "ali",
      filters: { status: "active" },
    });
    expect(info.signal).toBeInstanceOf(AbortSignal);
    // Re-render with the identical query → no re-emit.
    rerender();
    expect(onQueryChange).toHaveBeenCalledTimes(1);
  });

  it("aborts the superseded request when the query changes", () => {
    const seen: AbortSignal[] = [];
    const onQueryChange = vi.fn((_q, { signal }: { signal: AbortSignal }) => {
      seen.push(signal);
    });
    const adapter = createMemoryAdapter("");
    const { result } = renderHook(() =>
      useServerData<Row>({
        rows: ROWS,
        total: 40,
        onQueryChange,
        adapter,
      })
    );
    act(() => result.current.setSearch("bo"));
    expect(seen).toHaveLength(2);
    expect(seen[0]!.aborted).toBe(true);
    expect(seen[1]!.aborted).toBe(false);
  });

  it("rows pass through untouched; pager math comes from total", () => {
    const adapter = createMemoryAdapter("");
    const { result } = renderHook(() =>
      useServerData<Row>({ rows: ROWS, total: 40, adapter })
    );
    expect(result.current.rows).toBe(ROWS);
    expect(result.current.hasNextPage).toBe(true);
    expect(result.current.paginationMode).toBe("paged");
  });

  it("distinguishes first load from background refresh", () => {
    const adapter = createMemoryAdapter("");
    const first = renderHook(() =>
      useServerData<Row>({ rows: [], total: 0, loading: true, adapter })
    );
    expect(first.result.current.isLoading).toBe(true);
    const refresh = renderHook(() =>
      useServerData<Row>({ rows: ROWS, total: 3, loading: true, adapter })
    );
    expect(refresh.result.current.isLoading).toBe(false);
    expect(refresh.result.current.isFetching).toBe(true);
  });

  it("refetch re-emits the same query; fetchNextPage advances the page", () => {
    const onQueryChange = vi.fn();
    const adapter = createMemoryAdapter("");
    const { result } = renderHook(() =>
      useServerData<Row>({ rows: ROWS, total: 40, onQueryChange, adapter })
    );
    expect(onQueryChange).toHaveBeenCalledTimes(1);
    // `refetch` is optional on TableSource but useServerData always sets it.
    act(() => result.current.refetch!());
    expect(onQueryChange).toHaveBeenCalledTimes(2);
    act(() => result.current.fetchNextPage());
    expect(onQueryChange).toHaveBeenCalledTimes(3);
    expect(onQueryChange.mock.calls.at(-1)![0].page).toBe(2);
  });

  it("aborts the in-flight request on unmount", () => {
    const seen: AbortSignal[] = [];
    const adapter = createMemoryAdapter("");
    const { unmount } = renderHook(() =>
      useServerData<Row>({
        rows: ROWS,
        total: 3,
        onQueryChange: (_q, { signal }) => {
          seen.push(signal);
        },
        adapter,
      })
    );
    unmount();
    expect(seen[0]!.aborted).toBe(true);
  });

  it("stays silent without an onQueryChange emitter", () => {
    const adapter = createMemoryAdapter("");
    const { result } = renderHook(() =>
      useServerData<Row>({ rows: ROWS, total: 3, adapter })
    );
    expect(result.current.rows).toBe(ROWS);
  });
});
