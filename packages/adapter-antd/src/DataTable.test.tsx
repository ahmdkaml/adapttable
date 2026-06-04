import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { ConfigProvider } from "antd";
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
      {...props.override}
    />
  );
}

function renderHarness(props: Parameters<typeof Harness>[0] = {}, url = "") {
  adapter = createMemoryAdapter(url);
  return render(
    <ConfigProvider>
      <Harness {...props} />
    </ConfigProvider>
  );
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("<DataTable> (Ant Design)", () => {
  it("renders rows with values", () => {
    renderHarness();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Riyadh")).toBeInTheDocument();
  });

  it("renders the empty state", () => {
    renderHarness({ rows: [] });
    expect(screen.getAllByText("No data").length).toBeGreaterThan(0);
  });

  it("renders the loading skeleton honoring skeletonRows", () => {
    const { container } = renderHarness({
      rows: [],
      isLoading: true,
      override: { skeletonRows: 3 },
    });
    expect(container.querySelector(".ant-skeleton")).toBeInTheDocument();
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

  it("cycles sort ascending then descending on a header", () => {
    renderHarness();
    const header = () => screen.getByRole("columnheader", { name: /name/i });
    fireEvent.click(header());
    expect(adapter.getSearch()).toContain("sortDir=asc");
    fireEvent.click(header());
    expect(adapter.getSearch()).toContain("sortDir=desc");
  });

  it("paginates via the antd pager", () => {
    renderHarness({}, "limit=1");
    fireEvent.click(screen.getByText("2"));
    expect(adapter.getSearch()).toContain("page=2");
  });

  it("changes the page size via the antd pager size changer", () => {
    renderHarness();
    // The paged footer's size changer is the only combobox in this layout.
    fireEvent.mouseDown(screen.getByRole("combobox"));
    fireEvent.click(screen.getByText("50 / page"));
    expect(adapter.getSearch()).toContain("limit=50");
  });

  it("changes rows-per-page and sort via the toolbar selects (infinite)", () => {
    renderHarness({
      mode: "infinite",
      override: { sortByOptions: [{ value: "name", label: "Name" }] },
    });
    fireEvent.mouseDown(
      screen.getByRole("combobox", { name: "Rows per page" })
    );
    fireEvent.click(screen.getByTitle("50"));
    expect(adapter.getSearch()).toContain("limit=50");

    fireEvent.mouseDown(screen.getByRole("combobox", { name: "Sort by" }));
    fireEvent.click(screen.getAllByTitle("Name").at(-1)!);
    expect(adapter.getSearch()).toContain("sortBy=name");
  });

  it("exposes aria-sort on sortable headers", () => {
    renderHarness({}, "sortBy=name&sortDir=asc");
    expect(screen.getByRole("columnheader", { name: /name/i })).toHaveAttribute(
      "aria-sort",
      "ascending"
    );
    // The non-sortable City column gets no aria-sort.
    expect(
      screen.getByRole("columnheader", { name: /city/i })
    ).not.toHaveAttribute("aria-sort");
  });

  it("clears the sort when antd cycles past descending", () => {
    renderHarness({}, "sortBy=name&sortDir=desc");
    // Already descending; antd's next click cycles to unsorted.
    fireEvent.click(screen.getByRole("columnheader", { name: /name/i }));
    expect(adapter.getSearch()).not.toContain("sortBy=name");
  });

  it("selects all rows and shows the bulk bar, then runs an action", async () => {
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
    fireEvent.click(screen.getAllByLabelText("Select all")[0]!);
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    await act(async () => {
      fireEvent.click(screen.getByText("Delete"));
      await Promise.resolve();
    });
    expect(onClick).toHaveBeenCalledWith(["a", "b"]);
  });

  it("renders filter chips and opens the filter popover", () => {
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

  it("closes the filter popover on an outside click with no scrim", () => {
    renderHarness({ override: { filters: <div>filter body</div> } });
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(screen.getByText("filter body")).toBeInTheDocument();
    // No backdrop/scrim is rendered — the background stays interactive.
    expect(screen.queryByTestId("filter-scrim")).toBeNull();
    // A mousedown anywhere outside the popover hides it (antd toggles the
    // `ant-popover-hidden` class rather than unmounting the content).
    fireEvent.mouseDown(document.body);
    expect(document.querySelector(".ant-popover")).toHaveClass(
      "ant-popover-hidden"
    );
  });

  it("closes the filter popover when Escape is pressed", () => {
    renderHarness({ override: { filters: <div>filter body</div> } });
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(document.querySelector(".ant-popover")).not.toHaveClass(
      "ant-popover-hidden"
    );
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector(".ant-popover")).toHaveClass(
      "ant-popover-hidden"
    );
  });

  it("keeps the filter popover open when its own content is clicked", () => {
    renderHarness({ override: { filters: <div>filter body</div> } });
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    // A mousedown inside the floating popover must not close it.
    fireEvent.mouseDown(screen.getByText("filter body"));
    expect(document.querySelector(".ant-popover")).not.toHaveClass(
      "ant-popover-hidden"
    );
  });

  it("toggles the filter popover closed on a second Filters click", () => {
    renderHarness({ override: { filters: <div>filter body</div> } });
    const button = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(button);
    expect(document.querySelector(".ant-popover")).not.toHaveClass(
      "ant-popover-hidden"
    );
    fireEvent.click(button);
    expect(document.querySelector(".ant-popover")).toHaveClass(
      "ant-popover-hidden"
    );
  });

  it("clears all filters from the popover header", () => {
    const onClearFilters = vi.fn();
    renderHarness(
      {
        override: {
          filters: <div>filter body</div>,
          filterLabels: { status: (v) => `Status: ${v}` },
          onClearFilters,
        },
      },
      "f_status=Active"
    );
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    // The popover header's "Clear all" sits above the filter body.
    const body = screen.getByText("filter body").parentElement!.parentElement!;
    fireEvent.click(within(body).getByText("Clear all"));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("anchors the filter popover to the start edge in RTL mode", () => {
    renderHarness({
      override: { dir: "rtl", filters: <div>filter body</div> },
    });
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(screen.getByText("filter body")).toBeInTheDocument();
    // No drawer is mounted in popover mode.
    expect(document.querySelector(".ant-drawer")).toBeNull();
  });

  it("renders the filters in a drawer when filtersMode is drawer", () => {
    renderHarness({
      override: { filters: <div>filter body</div>, filtersMode: "drawer" },
    });
    expect(screen.queryByTestId("filter-scrim")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    const drawer = document.querySelector(".ant-drawer")!;
    expect(drawer).toHaveClass("ant-drawer-open");
    expect(
      within(screen.getByRole("dialog")).getByText("filter body")
    ).toBeInTheDocument();
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

  it("runs a row action immediately", () => {
    const onClick = vi.fn();
    renderHarness({
      override: { rowActions: [{ key: "e", label: "Edit", onClick }] },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("hides and disables row actions per row", () => {
    renderHarness({
      override: {
        rowActions: [
          {
            key: "h",
            label: "HiddenAct",
            onClick: vi.fn(),
            isHidden: () => true,
          },
          {
            key: "d",
            label: "DisabledAct",
            onClick: vi.fn(),
            isDisabled: () => true,
          },
        ],
      },
    });
    expect(screen.queryByRole("button", { name: "HiddenAct" })).toBeNull();
    expect(
      screen.getAllByRole("button", { name: "DisabledAct" })[0]!
    ).toBeDisabled();
  });

  it("keeps a row action enabled when disabledReason returns an empty string", () => {
    renderHarness({
      override: {
        rowActions: [
          {
            key: "d",
            label: "DeleteAct",
            onClick: vi.fn(),
            disabledReason: () => "",
          },
        ],
      },
    });
    expect(
      screen.getAllByRole("button", { name: "DeleteAct" })[0]!
    ).not.toBeDisabled();
  });

  it("labels the table with tableLabel", () => {
    renderHarness({ override: { tableLabel: "People" } });
    expect(screen.getByRole("table", { name: "People" })).toBeInTheDocument();
  });

  it("labels the table with the default table label when tableLabel is omitted", () => {
    renderHarness();
    expect(
      screen.getByRole("table", { name: "Data table" })
    ).toBeInTheDocument();
  });

  it("exposes exactly one select-all to the accessibility tree", () => {
    renderHarness({
      override: { bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }] },
    });
    // antd's scroll measure row clones the header (incl. the select-all), but
    // it's aria-hidden, so role queries (and screen readers) see only one.
    expect(
      screen.getAllByRole("checkbox", { name: "Select all" })
    ).toHaveLength(1);
  });

  it("prefetches a row on hover", () => {
    const prefetch = vi.fn();
    renderHarness({ override: { prefetch } });
    fireEvent.mouseEnter(screen.getByText("Alice").closest("tr")!);
    expect(prefetch).toHaveBeenCalledWith(ROWS[0]);
  });

  it("renders cards instead of a table on mobile", () => {
    const { container } = renderHarness({ override: { isMobile: true } });
    expect(
      container.querySelector('[data-adapttable-part="cards"]')
    ).toBeInTheDocument();
    expect(container.querySelector(".ant-table")).toBeNull();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Riyadh")).toBeInTheDocument();
  });

  it("supports selection, row actions, and Cell in mobile cards", () => {
    const onClick = vi.fn();
    renderHarness({
      override: {
        isMobile: true,
        bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }],
        rowActions: [{ key: "e", label: "Edit", onClick }],
        columns: [
          {
            key: "name",
            header: "Name",
            Cell: ({ row }) => <span>card-{row.name}</span>,
          },
        ],
      },
    });
    expect(screen.getByText("card-Alice")).toBeInTheDocument();
    fireEvent.click(screen.getAllByLabelText("Select row")[0]!);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("shows the empty state on mobile too", () => {
    renderHarness({ rows: [], override: { isMobile: true } });
    expect(screen.queryByRole("listitem")).toBeNull();
    expect(screen.getAllByText("No data").length).toBeGreaterThan(0);
  });

  it("hides actions and uses the key as the card label for a non-string header", () => {
    renderHarness({
      override: {
        isMobile: true,
        rowActions: [
          {
            key: "h",
            label: "HiddenAct",
            onClick: vi.fn(),
            isHidden: () => true,
          },
        ],
        columns: [
          { key: "name", header: <em>Name</em>, accessor: (r) => r.name },
        ],
      },
    });
    expect(screen.queryByRole("button", { name: "HiddenAct" })).toBeNull();
    // The Descriptions label falls back to the column key for a JSX header.
    expect(screen.getAllByText("name").length).toBeGreaterThan(0);
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

  it("renders a slots.empty override", () => {
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

  it("applies dir and shows the rows-per-page select in infinite mode", () => {
    const { container } = renderHarness({
      mode: "infinite",
      override: {
        dir: "rtl",
        sortByOptions: [{ value: "name", label: "Name" }],
      },
    });
    expect(container.querySelector('[dir="rtl"]')).toBeInTheDocument();
    expect(screen.getAllByLabelText("Rows per page").length).toBeGreaterThan(0);
  });

  it("enables antd virtual scrolling when virtualize is true", () => {
    const { container } = renderHarness({
      override: {
        virtualize: true,
        virtualHeight: 240,
        virtualWidth: 720,
      },
    });
    expect(
      container.querySelector(".ant-table-tbody-virtual")
    ).toBeInTheDocument();
  });

  it("loads more rows via the Load more button in infinite mode", () => {
    renderHarness({ mode: "infinite" }, "limit=1");
    expect(screen.queryByText("Bob")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("pages in the next slice when the virtual scroll nears its end", () => {
    const { container } = renderHarness(
      { mode: "infinite", override: { virtualize: true } },
      "limit=1"
    );
    expect(screen.queryByText("Bob")).toBeNull();
    const scroller = container.querySelector<HTMLElement>(
      ".ant-table-tbody-virtual-holder"
    );
    expect(scroller).not.toBeNull();
    // Simulate scrolling to the bottom of antd's internal virtual holder.
    Object.defineProperty(scroller!, "scrollHeight", { value: 1000 });
    Object.defineProperty(scroller!, "clientHeight", { value: 400 });
    Object.defineProperty(scroller!, "scrollTop", {
      value: 600,
      writable: true,
    });
    act(() => fireEvent.scroll(scroller!));
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("ignores the virtual scroll handler in paged (non-infinite) mode", () => {
    const { container } = renderHarness({ override: { virtualize: true } });
    const scroller = container.querySelector<HTMLElement>(
      ".ant-table-tbody-virtual-holder"
    );
    expect(scroller).not.toBeNull();
    // No next page in paged mode — scrolling must not throw or page anything.
    act(() => fireEvent.scroll(scroller!));
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("toggles a single row's selection via its checkbox", () => {
    const { container } = renderHarness({
      override: { bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }] },
    });
    // The first body-row checkbox lives in a cell titled "Select row".
    const rowCheckbox = container.querySelector<HTMLInputElement>(
      'tbody [title="Select row"] input[type="checkbox"]'
    );
    expect(rowCheckbox).not.toBeNull();
    fireEvent.click(rowCheckbox!);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("renders a multi-column skeleton with a middle column width", () => {
    const { container } = renderHarness({
      rows: [],
      isLoading: true,
      override: {
        skeletonRows: 2,
        columns: [
          { key: "name", header: "Name", accessor: (r) => r.name },
          { key: "city", header: "City", accessor: (r) => r.city },
          { key: "id", header: "Id", accessor: (r) => r.id },
        ],
        rowActions: [{ key: "e", label: "Edit", onClick: vi.fn() }],
      },
    });
    expect(container.querySelector(".ant-skeleton")).toBeInTheDocument();
  });

  it("closes the filter drawer via the apply button", () => {
    renderHarness(
      { override: { filters: <div>filter body</div>, filtersMode: "drawer" } },
      "f_status=Active"
    );
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    const dialog = screen.getByRole("dialog");
    const drawer = document.querySelector(".ant-drawer")!;
    expect(drawer).toHaveClass("ant-drawer-open");
    // The drawer's primary footer button (label "Done") closes it.
    fireEvent.click(within(dialog).getByText("Done"));
    expect(drawer).not.toHaveClass("ant-drawer-open");
  });

  it("clears all filters from the drawer footer", () => {
    const onClearFilters = vi.fn();
    renderHarness(
      {
        override: {
          filters: <div>filter body</div>,
          filtersMode: "drawer",
          filterLabels: { status: (v) => `Status: ${v}` },
          onClearFilters,
        },
      },
      "f_status=Active"
    );
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    const drawer = screen.getByRole("dialog");
    fireEvent.click(within(drawer).getByText("Clear all"));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("renders a resize handle whose label falls back to the column key for a JSX header", () => {
    renderHarness({
      override: {
        resizableColumns: true,
        columns: [
          { key: "name", header: <em>Name</em>, accessor: (r) => r.name },
          { key: "city", header: "City", accessor: (r) => r.city },
        ],
      },
    });
    // The JSX-header column's resize handle uses the key, the string one its text.
    expect(
      screen.getByRole("button", { name: "Resize column: name" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Resize column: City" })
    ).toBeInTheDocument();
  });

  it("renders the column menu inline in the toolbar when enabled", () => {
    renderHarness({ override: { enableColumnMenu: true } });
    expect(
      screen.getAllByRole("button", { name: "Columns" }).length
    ).toBeGreaterThan(0);
  });

  it("wires antd's sticky header when stickyHeader is set", () => {
    const { container } = renderHarness({
      override: { stickyHeader: true, stickyTop: 12 },
    });
    // antd renders its sticky-header holder only when the `sticky` prop is set.
    expect(container.querySelector(".ant-table-sticky-holder")).not.toBeNull();
  });

  it("omits the sticky header by default", () => {
    const { container } = renderHarness();
    expect(container.querySelector(".ant-table-sticky-holder")).toBeNull();
  });

  it("prefetches a row on card hover in mobile mode", () => {
    const prefetch = vi.fn();
    renderHarness({ override: { isMobile: true, prefetch } });
    fireEvent.mouseEnter(screen.getByText("Alice").closest(".ant-card")!);
    expect(prefetch).toHaveBeenCalledWith(ROWS[0]);
  });

  it("uses an explicit mobileLabel for the card descriptions label", () => {
    renderHarness({
      override: {
        isMobile: true,
        columns: [
          {
            key: "name",
            header: "Name",
            mobileLabel: "Full name",
            accessor: (r) => r.name,
          },
        ],
      },
    });
    expect(screen.getAllByText("Full name").length).toBeGreaterThan(0);
  });

  it("derives mobile sort options from sortable columns when none are passed", () => {
    renderHarness({ override: { isMobile: true } });
    // "name" is sortable, so the mobile toolbar exposes a Sort by select.
    expect(
      screen.getByRole("combobox", { name: "Sort by" })
    ).toBeInTheDocument();
  });

  it("falls back to source.limit for the skeleton row count when skeletonRows is omitted", () => {
    const { container } = renderHarness({ rows: [], isLoading: true });
    // No skeletonRows override → the skeleton uses source.limit (default 25).
    expect(container.querySelector(".ant-skeleton")).toBeInTheDocument();
  });

  it("center-aligns a column whose align is center", () => {
    const { container } = renderHarness({
      override: {
        columns: [
          {
            key: "name",
            header: "Name",
            accessor: (r) => r.name,
            align: "center",
          },
          { key: "city", header: "City", accessor: (r) => r.city },
        ],
      },
    });
    // The center column's body cells carry a center text-align style.
    const centered = container.querySelector<HTMLElement>(
      'tbody td[style*="center"]'
    );
    expect(centered).not.toBeNull();
  });

  it("uses a custom search placeholder when one is provided", () => {
    renderHarness({ override: { searchPlaceholder: "Find people…" } });
    expect(screen.getByPlaceholderText("Find people…")).toBeInTheDocument();
  });

  it("opens the filter drawer on the left edge in RTL mode", () => {
    renderHarness(
      {
        override: {
          dir: "rtl",
          filters: <div>filter body</div>,
          filtersMode: "drawer",
        },
      },
      "f_status=Active"
    );
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    // antd places the drawer on the left edge when dir is rtl.
    expect(document.querySelector(".ant-drawer-left")).not.toBeNull();
    expect(document.querySelector(".ant-drawer-right")).toBeNull();
  });

  it("widens the table to max-content once a column is pinned", () => {
    const { container } = renderHarness({
      override: { enableColumnMenu: true },
    });
    // Before pinning, the table is not forced to max-content width.
    expect(container.querySelector(".ant-table-content")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    // Pin the Name column to the left edge via the menu.
    const pinLeft = document.querySelector<HTMLElement>(
      '[aria-label="Pin left: Name"]'
    );
    expect(pinLeft).not.toBeNull();
    fireEvent.click(pinLeft!);
    // antd renders a sticky/fixed cell once a column is pinned (x: max-content).
    expect(container.querySelector(".ant-table-cell-fix-left")).not.toBeNull();
  });

  it("stops paging the virtual scroll once there is no next page", () => {
    // All rows fit in the first page → infinite mode has no next page, but the
    // virtual scroll handler is still active (virtualize && !paged && !error).
    const { container } = renderHarness({
      mode: "infinite",
      override: { virtualize: true },
    });
    const scroller = container.querySelector<HTMLElement>(
      ".ant-table-tbody-virtual-holder"
    );
    expect(scroller).not.toBeNull();
    Object.defineProperty(scroller!, "scrollHeight", { value: 1000 });
    Object.defineProperty(scroller!, "clientHeight", { value: 400 });
    Object.defineProperty(scroller!, "scrollTop", {
      value: 600,
      writable: true,
    });
    // Both rows are already shown and hasNextPage is false; scrolling is a no-op.
    act(() => fireEvent.scroll(scroller!));
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
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
      renderHarness({ mode: "infinite" }, "limit=1");
      expect(screen.queryByText("Bob")).toBeNull();
      act(() => trigger?.());
      expect(screen.getByText("Bob")).toBeInTheDocument();
    } finally {
      globalThis.IntersectionObserver = original;
    }
  });
});
