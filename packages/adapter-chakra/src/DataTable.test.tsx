import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
import { ChakraProvider } from "@chakra-ui/react";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Row {
  id: string;
  name: string;
  city: string;
}
const ROWS: Row[] = [
  { id: "a", name: "Alice", city: "Dubai" },
  { id: "b", name: "Bob", city: "Riyadh" },
];
const columns: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "city", header: "City", accessor: (r) => r.city },
];

let adapter: ReturnType<typeof createMemoryAdapter>;

function Harness(props: {
  rows?: readonly Row[];
  mode?: "paged" | "infinite";
  isMobile?: boolean;
  error?: Error | null;
  refetch?: () => void;
  isLoading?: boolean;
  override?: Partial<Parameters<typeof DataTable<Row>>[0]>;
}) {
  const source = useFrontendData<Row>({
    data: props.rows ?? ROWS,
    adapter,
    columns,
    paginationMode: props.mode ?? "paged",
    error: props.error ?? null,
    refetch: props.refetch,
    isLoading: props.isLoading,
  });
  return (
    <DataTable
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      isMobile={props.isMobile}
      {...props.override}
    />
  );
}

function renderHarness(props: Parameters<typeof Harness>[0] = {}, url = "") {
  adapter = createMemoryAdapter(url);
  return render(
    <ChakraProvider>
      <Harness {...props} />
    </ChakraProvider>
  );
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("<DataTable> (Chakra)", () => {
  it("renders rows with values", () => {
    renderHarness();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Riyadh")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    renderHarness({ rows: [] });
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders loading skeletons", () => {
    renderHarness({ rows: [], isLoading: true });
    expect(screen.getByTestId("adapttable-loading")).toBeInTheDocument();
  });

  it("surfaces an error and retries", () => {
    const refetch = vi.fn();
    renderHarness({ error: new Error("boom"), refetch });
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /retry/i }));
    expect(refetch).toHaveBeenCalled();
  });

  it("omits the retry button when the source has no refetch", () => {
    renderHarness({ error: new Error("boom") });
    expect(screen.getByText(/boom/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /retry/i })).toBeNull();
  });

  it("commits debounced search to the URL", () => {
    renderHarness();
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "ali" },
    });
    act(() => vi.advanceTimersByTime(300));
    expect(adapter.getSearch()).toContain("q=ali");
  });

  it("cycles sort on a header", () => {
    renderHarness();
    fireEvent.click(screen.getByRole("button", { name: /sort by: name/i }));
    expect(adapter.getSearch()).toContain("sortDir=asc");
    fireEvent.click(screen.getByRole("button", { name: /sort by: name/i }));
    expect(adapter.getSearch()).toContain("sortDir=desc");
  });

  it("paginates via prev/next", () => {
    renderHarness({}, "limit=1");
    fireEvent.click(screen.getByRole("button", { name: "Next page" }));
    expect(adapter.getSearch()).toContain("page=2");
  });

  it("runs a bulk action after confirm", async () => {
    const onClick = vi.fn();
    const confirm = vi.fn((r: { onConfirm: () => void }) => r.onConfirm());
    renderHarness({
      override: {
        bulkActions: [
          {
            key: "del",
            label: "Delete",
            onClick,
            confirm: {
              title: "t",
              message: (n) => `Delete ${n}`,
              confirmLabel: "Yes",
            },
          },
        ],
        confirm,
      },
    });
    fireEvent.click(screen.getByLabelText("Select all"));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
      await Promise.resolve();
    });
    expect(onClick).toHaveBeenCalledWith(["a", "b"]);
  });

  it("renders filter chips and opens the drawer", () => {
    renderHarness(
      {
        override: {
          filters: <div>filter body</div>,
          filterLabels: { status: (v) => `Status: ${v}` },
        },
      },
      "f_status=Active"
    );
    expect(screen.getByText("Status: Active")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(screen.getByText("filter body")).toBeInTheDocument();
  });

  it("removes a chip", () => {
    renderHarness(
      { override: { filterLabels: { status: (v) => `Status: ${v}` } } },
      "f_status=Active"
    );
    fireEvent.click(screen.getByLabelText("Clear all: Status: Active"));
    expect(adapter.getSearch()).not.toContain("f_status");
  });

  it("renders mobile cards when isMobile", () => {
    renderHarness({ isMobile: true });
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("runs a row action immediately", () => {
    const onClick = vi.fn();
    renderHarness({
      override: { rowActions: [{ key: "e", label: "Edit", onClick }] },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("applies dir and shows the sort + rows-per-page selects in infinite mode", () => {
    const { container } = renderHarness({
      mode: "infinite",
      override: {
        dir: "rtl",
        sortByOptions: [{ value: "name", label: "Name" }],
      },
    });
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
    expect(screen.getByLabelText("Sort by")).toBeInTheDocument();
    expect(screen.getByLabelText("Rows per page")).toBeInTheDocument();
  });

  it("changes rows-per-page (infinite) and sort selects", () => {
    renderHarness({
      mode: "infinite",
      override: { sortByOptions: [{ value: "name", label: "Name" }] },
    });
    fireEvent.change(screen.getByLabelText("Rows per page"), {
      target: { value: "50" },
    });
    expect(adapter.getSearch()).toContain("limit=50");
    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "name" },
    });
    expect(adapter.getSearch()).toContain("sortBy=name");
  });

  it("renders a slots.empty override and merges extraChips", () => {
    renderHarness({
      rows: [],
      override: { slots: { empty: <div>nada</div> } },
    });
    expect(screen.getByText("nada")).toBeInTheDocument();
  });

  it("renders a slots.skeleton override while loading", () => {
    renderHarness({
      rows: [],
      isLoading: true,
      override: { slots: { skeleton: <div>loading-custom</div> } },
    });
    expect(screen.getByText("loading-custom")).toBeInTheDocument();
  });

  it("merges extraChips with label chips", () => {
    renderHarness(
      {
        override: {
          filterLabels: { status: (v) => `Status: ${v}` },
          extraChips: [{ key: "x", label: "Custom", onRemove: vi.fn() }],
        },
      },
      "f_status=Active"
    );
    expect(screen.getByText("Status: Active")).toBeInTheDocument();
    expect(screen.getByText("Custom")).toBeInTheDocument();
  });

  it("mobile: selection + row action work", () => {
    const onClick = vi.fn();
    renderHarness({
      isMobile: true,
      override: {
        bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }],
        rowActions: [{ key: "e", label: "Edit", onClick }],
      },
    });
    const checks = screen.getAllByLabelText("Select row");
    expect(checks.length).toBe(2);
    fireEvent.click(checks[0]!);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("bulk action with disabledReason is disabled", () => {
    renderHarness({
      override: {
        bulkActions: [
          {
            key: "d",
            label: "Delete",
            onClick: vi.fn(),
            disabledReason: () => "no",
          },
        ],
      },
    });
    fireEvent.click(screen.getByLabelText("Select all"));
    expect(screen.getByText("Delete").closest("button")).toBeDisabled();
  });

  it("fires prefetch on desktop row hover and renders a custom Cell", () => {
    const prefetch = vi.fn();
    const cellCols: ColumnDef<Row>[] = [
      {
        key: "name",
        header: "Name",
        align: "center",
        Cell: ({ row }) => <b data-testid="c">{row.name}</b>,
      },
    ];
    renderHarness({ override: { prefetch, columns: cellCols } });
    const row = within(screen.getAllByTestId("c")[0]!.closest("tr")!);
    fireEvent.mouseEnter(row.getByTestId("c").closest("tr")!);
    expect(prefetch).toHaveBeenCalled();
  });

  it("loads more rows via the Load more button in infinite mode", () => {
    renderHarness({ mode: "infinite" }, "limit=1");
    expect(screen.queryByText("Bob")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("auto-loads the next page when the sentinel scrolls into view", () => {
    let trigger: (() => void) | undefined;
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = vi
      .fn()
      .mockImplementation((cb: IntersectionObserverCallback) => ({
        observe: () => {
          trigger = () =>
            cb(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              {} as IntersectionObserver
            );
        },
        disconnect: () => undefined,
        unobserve: () => undefined,
      }));
    try {
      renderHarness({ mode: "infinite" }, "limit=1");
      expect(screen.queryByText("Bob")).toBeNull();
      act(() => trigger?.());
      expect(screen.getByText("Bob")).toBeInTheDocument();
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  it("renders a column via the Cell render-prop", () => {
    renderHarness({
      override: {
        columns: [
          {
            key: "name",
            header: "Name",
            Cell: ({ row }) => <span>cell-{row.name}</span>,
          },
        ],
      },
    });
    expect(screen.getByText("cell-Alice")).toBeInTheDocument();
  });

  it("renders a Cell render-prop in mobile cards", () => {
    renderHarness({
      isMobile: true,
      override: {
        columns: [
          {
            key: "name",
            header: "Name",
            Cell: ({ row }) => <span>m-{row.name}</span>,
          },
        ],
      },
    });
    expect(screen.getByText("m-Alice")).toBeInTheDocument();
  });

  it("uses the column key as the mobile label for a non-string header", () => {
    renderHarness({
      isMobile: true,
      override: {
        columns: [
          { key: "name", header: <em>Name</em>, accessor: (r) => r.name },
        ],
      },
    });
    expect(screen.getAllByText("name").length).toBeGreaterThan(0);
  });
});
