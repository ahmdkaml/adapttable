import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
import {
  act,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
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

function renderHarness(
  props: Parameters<typeof Harness>[0] = {},
  initialUrl = ""
) {
  adapter = createMemoryAdapter(initialUrl);
  return render(<Harness {...props} />);
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("<DataTable> (unstyled)", () => {
  it("renders a semantic table with rows and data hooks", () => {
    const { container } = renderHarness();
    expect(
      container.querySelector('[data-adapttable-part="root"]')
    ).toBeInTheDocument();
    expect(container.querySelector("table")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Riyadh")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    renderHarness({ rows: [] });
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders a custom empty state", () => {
    renderHarness({ rows: [], override: { emptyState: <div>nada</div> } });
    expect(screen.getByText("nada")).toBeInTheDocument();
  });

  it("renders the loading state", () => {
    const { container } = renderHarness({ rows: [], isLoading: true });
    expect(
      container.querySelector('[data-adapttable-part="loading"]')
    ).toBeInTheDocument();
  });

  it("renders an error with a working retry", () => {
    const refetch = vi.fn();
    renderHarness({ error: new Error("boom"), refetch });
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    fireEvent.click(screen.getByText("Retry"));
    expect(refetch).toHaveBeenCalled();
  });

  it("omits the retry button when the source has no refetch", () => {
    renderHarness({ error: new Error("boom") });
    expect(screen.getByRole("alert")).toHaveTextContent("boom");
    expect(screen.queryByText("Retry")).toBeNull();
  });

  it("clears all active filters from the chip strip", () => {
    const onClearFilters = vi.fn();
    renderHarness(
      {
        override: {
          filterLabels: { status: (v) => `Status: ${v}` },
          onClearFilters,
        },
      },
      "f_status=Active"
    );
    const chipStrip = screen.getByRole("list", { name: "Filters" });
    fireEvent.click(within(chipStrip).getByText("Clear all"));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("commits debounced search to the URL", () => {
    renderHarness();
    fireEvent.change(screen.getByRole("searchbox"), {
      target: { value: "ali" },
    });
    act(() => vi.advanceTimersByTime(300));
    expect(adapter.getSearch()).toContain("q=ali");
  });

  it("cycles sort on a header button", () => {
    renderHarness();
    const btn = screen.getByRole("button", { name: /sort by: name/i });
    fireEvent.click(btn);
    expect(adapter.getSearch()).toContain("sortDir=asc");
    fireEvent.click(btn);
    expect(adapter.getSearch()).toContain("sortDir=desc");
  });

  it("paginates via the footer next button", () => {
    renderHarness({}, "limit=1");
    const next = screen.getByRole("button", { name: "Next page" });
    fireEvent.click(next);
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

  it("renders filter chips and toggles the filters panel", () => {
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
    expect(screen.queryByText("filter body")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(screen.getByText("filter body")).toBeInTheDocument();
  });

  it("renders mobile cards when isMobile", () => {
    const { container } = renderHarness({ isMobile: true });
    expect(
      container.querySelector('[data-adapttable-part="cards"]')
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sort by/i })).toBeNull();
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

  it("runs a row action without confirm immediately", () => {
    const onClick = vi.fn();
    renderHarness({
      override: { rowActions: [{ key: "e", label: "Edit", onClick }] },
    });
    fireEvent.click(screen.getAllByLabelText("Edit")[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
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

  it("applies per-part classNames and dir", () => {
    const { container } = renderHarness({
      override: {
        dir: "rtl",
        classNames: { root: "my-root", table: "my-table" },
      },
    });
    const root = container.querySelector('[data-adapttable-part="root"]');
    expect(root).toHaveClass("my-root");
    expect(root).toHaveAttribute("dir", "rtl");
    expect(container.querySelector("table")).toHaveClass("my-table");
  });

  it("shows the rows-per-page select in infinite mode", () => {
    renderHarness({ mode: "infinite" });
    expect(screen.getAllByLabelText("Rows per page").length).toBeGreaterThan(0);
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
});
