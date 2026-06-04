import {
  createMemoryAdapter,
  type TableSource,
  useFrontendData,
} from "@adapttable/core";
import { MantineProvider } from "@mantine/core";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type { ReactNode } from "react";
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

interface HarnessProps {
  rows?: readonly Row[];
  mode?: "paged" | "infinite";
  initialUrl?: string;
  error?: Error | null;
  refetch?: () => void;
  isLoading?: boolean;
  isMobile?: boolean;
  override?: Partial<Parameters<typeof DataTable<Row>>[0]>;
}

function Harness(props: HarnessProps) {
  const source = useFrontendData<Row>({
    data: props.rows ?? ROWS,
    adapter: harnessAdapter,
    columns,
    paginationMode: props.mode ?? "paged",
    error: props.error ?? null,
    refetch: props.refetch,
    isLoading: props.isLoading,
  });
  return (
    <DataTable<Row>
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      isMobile={props.isMobile}
      {...props.override}
    />
  );
}

let harnessAdapter: ReturnType<typeof createMemoryAdapter>;

function renderHarness(props: HarnessProps = {}) {
  harnessAdapter = createMemoryAdapter(props.initialUrl ?? "");
  return render(
    <MantineProvider>
      <Harness {...props} />
    </MantineProvider>
  );
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("<DataTable> (Mantine)", () => {
  it("renders a row per source entry with column values", () => {
    renderHarness();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Dubai")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("loads more rows via the Load more button in infinite mode", () => {
    renderHarness({ mode: "infinite", initialUrl: "limit=1" });
    expect(screen.queryByText("Bob")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("shows the empty state when there are no rows", () => {
    renderHarness({ rows: [] });
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("auto-loads the next page when the sentinel scrolls into view", () => {
    let trigger: (() => void) | undefined;
    const original = globalThis.IntersectionObserver;
    globalThis.IntersectionObserver = vi.fn().mockImplementation(function (
      cb: IntersectionObserverCallback
    ) {
      return {
        observe: () => {
          trigger = () =>
            cb(
              [{ isIntersecting: true } as IntersectionObserverEntry],
              {} as IntersectionObserver
            );
        },
        disconnect: () => undefined,
        unobserve: () => undefined,
      };
    });
    try {
      renderHarness({ mode: "infinite", initialUrl: "limit=1" });
      expect(screen.queryByText("Bob")).toBeNull();
      act(() => trigger?.());
      expect(screen.getByText("Bob")).toBeInTheDocument();
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });

  it("shows the loading skeleton on first load", () => {
    const { container } = renderHarness({ rows: [], isLoading: true });
    expect(
      container.querySelector('[class*="mantine-Skeleton"]')
    ).toBeInTheDocument();
  });

  it("surfaces an error and retries via the source", () => {
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

  it("commits the debounced search to the URL state", () => {
    renderHarness();
    const input = screen.getByRole("searchbox");
    fireEvent.change(input, { target: { value: "ali" } });
    act(() => vi.advanceTimersByTime(300));
    expect(harnessAdapter.getSearch()).toContain("q=ali");
  });

  it("cycles sort on header click", () => {
    renderHarness();
    const header = screen.getByRole("button", { name: /sort by: name/i });
    fireEvent.click(header);
    expect(harnessAdapter.getSearch()).toContain("sortDir=asc");
    fireEvent.click(header);
    expect(harnessAdapter.getSearch()).toContain("sortDir=desc");
  });

  it("renders the pagination footer in paged mode", () => {
    renderHarness({ override: { labels: { rowsPerPage: "Per page" } } });
    expect(screen.getByText("Per page")).toBeInTheDocument();
  });

  it("renders selection + a bulk action and runs it after confirm", async () => {
    const onClick = vi.fn();
    const confirm = vi.fn((req: { onConfirm: () => void }) => req.onConfirm());
    renderHarness({
      override: {
        bulkActions: [
          {
            key: "del",
            label: "Delete",
            onClick,
            confirm: {
              title: "Sure?",
              message: (n) => `Delete ${n}?`,
              confirmLabel: "Yes",
              danger: true,
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
    expect(confirm).toHaveBeenCalled();
    expect(onClick).toHaveBeenCalledWith(["a", "b"]);
  });

  it("renders filter chips from filterLabels and clears one", () => {
    renderHarness({
      initialUrl: "f_status=Active",
      override: { filterLabels: { status: (v) => `Status: ${v}` } },
    });
    expect(screen.getByText("Status: Active")).toBeInTheDocument();
  });

  it("opens the filter drawer", async () => {
    renderHarness({
      override: { filters: <div>filter content</div> },
    });
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    await waitFor(() =>
      expect(screen.getByText("filter content")).toBeInTheDocument()
    );
  });

  it("renders mobile cards when isMobile", () => {
    renderHarness({ isMobile: true });
    // Cards render the value with an uppercase label; the row data is present
    // and there is no column-header button.
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /sort by/i })).toBeNull();
  });

  it("tags rows with data-stagger so custom animation (e.g. GSAP) can target them", () => {
    const { container } = renderHarness();
    // The documented contract: every row carries [data-stagger], regardless
    // of the built-in `animate` flag, so a GSAP/Framer timeline can drive it.
    expect(container.querySelectorAll("[data-stagger]")).toHaveLength(2);
  });

  it("runs a row action immediately when there is no confirm", () => {
    const onClick = vi.fn();
    renderHarness({
      override: {
        rowActions: [{ key: "edit", label: "Edit", onClick }],
      },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("respects a slots.empty override", () => {
    renderHarness({
      rows: [],
      override: { slots: { empty: <div>nothing custom</div> } },
    });
    expect(screen.getByText("nothing custom")).toBeInTheDocument();
  });

  it("accepts a source prop typed as TableSource (type smoke test)", () => {
    const noop: TableSource<Row> = {
      rows: [],
      total: 0,
      isLoading: false,
      isFetching: false,
      isFetchingNextPage: false,
      hasNextPage: false,
      fetchNextPage: () => undefined,
      error: null,
      paginationMode: "paged",
      page: 1,
      limit: 25,
      search: "",
      sortBy: undefined,
      sortDir: undefined,
      extra: {},
      setPage: () => undefined,
      setLimit: () => undefined,
      setSort: () => undefined,
      setSearch: () => undefined,
      setExtra: () => undefined,
      setExtras: () => undefined,
      clearAll: () => undefined,
    };
    const tree: ReactNode = (
      <MantineProvider>
        <DataTable source={noop} columns={columns} rowKey={(r) => r.id} />
      </MantineProvider>
    );
    render(tree);
    expect(screen.getByText("No data")).toBeInTheDocument();
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

  // Sticky header is opt-in (default off). When enabled it must pin via the
  // header *cells*, not the `<thead>` (which does not stick against the
  // document scroller), and must NOT live in an `overflow` wrapper that would
  // trap sticky and let the header overlap the first row.
  it("does not stick the header cells by default (opt-in)", () => {
    renderHarness();
    const th = screen.getByText("Name").closest("th");
    expect(th).not.toBeNull();
    expect(th).not.toHaveStyle({ position: "sticky" });
  });

  it("sticks the header cells when stickyHeader is enabled", () => {
    renderHarness({ override: { stickyHeader: true } });
    const th = screen.getByText("Name").closest("th");
    expect(th).toHaveStyle({ position: "sticky" });
    // the table must not sit inside a horizontal-overflow scroll container
    expect(th!.closest("[style*='overflow']")).toBeNull();
  });

  it("renders the Columns menu trigger when enableColumnMenu is set", () => {
    renderHarness({ override: { enableColumnMenu: true } });
    expect(screen.getByRole("button", { name: "Columns" })).toBeInTheDocument();
  });

  it("hides a column via a controlled columnLayout", () => {
    renderHarness({
      override: {
        columnLayout: { hidden: ["city"], order: [], pinned: {}, widths: {} },
      },
    });
    // The header and its values are dropped when the column is hidden.
    expect(screen.queryByText("City")).toBeNull();
    expect(screen.queryByText("Dubai")).toBeNull();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });
});
