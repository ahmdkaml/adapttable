/**
 * Gap-fill: mobile selection + row actions, footer interactions, and the
 * bulk disabled-reason path.
 */
import {
  createMemoryAdapter,
  useFrontendData,
  useTableVirtualization,
  type VirtualTableRow,
} from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Row {
  id: string;
  name: string;
}
const ROWS: Row[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];
const columns: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name },
];

vi.mock("@adapttable/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useTableVirtualization: vi.fn(),
  };
});

let adapter: ReturnType<typeof createMemoryAdapter>;

beforeEach(() => {
  vi.mocked(useTableVirtualization).mockImplementation(({ rows, rowKey }) => ({
    enabled: false,
    rows: rows.map((row, index) => ({
      row,
      index,
      key: rowKey(row),
    })),
    paddingTop: 0,
    paddingBottom: 0,
  }));
});

function Harness(props: {
  isMobile?: boolean;
  mode?: "paged" | "infinite";
  override?: Partial<Parameters<typeof DataTable<Row>>[0]>;
}) {
  const source = useFrontendData<Row>({
    data: ROWS,
    adapter,
    columns,
    paginationMode: props.mode ?? "paged",
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
  return render(<Harness {...props} />);
}

describe("<DataTable> (unstyled) gaps", () => {
  it("mobile: selection checkboxes toggle and bulk bar appears", () => {
    renderHarness({
      isMobile: true,
      override: { bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }] },
    });
    const checkboxes = screen.getAllByLabelText("Select row");
    expect(checkboxes.length).toBe(2);
    fireEvent.click(checkboxes[0]!);
    expect(screen.getByText("1 selected")).toBeInTheDocument();
  });

  it("mobile: row actions render and fire", () => {
    const onClick = vi.fn();
    renderHarness({
      isMobile: true,
      override: { rowActions: [{ key: "e", label: "Edit", onClick }] },
    });
    fireEvent.click(screen.getAllByLabelText("Edit")[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("footer: changing rows-per-page commits a new limit", () => {
    renderHarness({}, "page=1");
    const select = screen.getAllByLabelText("Rows per page")[0]!;
    fireEvent.change(select, { target: { value: "50" } });
    expect(adapter.getSearch()).toContain("limit=50");
  });

  it("footer: previous button goes back a page", () => {
    renderHarness({}, "limit=1&page=2");
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    // page=1 is the default and is dropped from the URL.
    expect(adapter.getSearch()).not.toContain("page=2");
  });

  it("bulk action with a disabledReason is disabled and titled", () => {
    const onClick = vi.fn();
    renderHarness({
      override: {
        bulkActions: [
          {
            key: "del",
            label: "Delete",
            onClick,
            disabledReason: () => "Referenced",
          },
        ],
      },
    });
    fireEvent.click(screen.getByLabelText("Select all"));
    const btn = screen.getByText("Delete");
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("title", "Referenced");
  });

  it("fires prefetch on desktop row hover", () => {
    const prefetch = vi.fn();
    renderHarness({ override: { prefetch } });
    const row = screen.getByText("Alice").closest("tr")!;
    fireEvent.mouseEnter(row);
    expect(prefetch).toHaveBeenCalledWith(ROWS[0]);
  });

  it("renders a sort-by select and commits a sort", () => {
    renderHarness({
      override: { sortByOptions: [{ value: "name", label: "Name" }] },
    });
    fireEvent.change(screen.getByLabelText("Sort by"), {
      target: { value: "name" },
    });
    expect(adapter.getSearch()).toContain("sortBy=name");
  });

  it("renders the filters button without a count when no filters are active", () => {
    renderHarness({
      override: { filters: <div>filter body</div> },
    });
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
  });

  it("opens a modal filter drawer with backdrop and done action", () => {
    renderHarness({
      override: { filters: <div>filter body</div> },
    });
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByText("filter body")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Done" }));
    expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull();
  });

  it("closes the filter drawer on Escape", () => {
    renderHarness({ override: { filters: <div>filter body</div> } });
    fireEvent.click(screen.getByRole("button", { name: "Filters" }));
    expect(screen.getByRole("dialog", { name: "Filters" })).toBeInTheDocument();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Filters" })).toBeNull();
  });

  it("virtualizes desktop rows when enabled", () => {
    vi.mocked(useTableVirtualization).mockReturnValue({
      enabled: true,
      rows: [
        {
          row: { id: "b", name: "Bob" },
          index: 1,
          key: "b",
        } satisfies VirtualTableRow<Row>,
      ],
      paddingTop: 40,
      paddingBottom: 40,
      measureElement: vi.fn(),
    });
    renderHarness({
      mode: "infinite",
      override: { virtualize: true, estimateRowSize: 40 },
    });
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("virtualizes mobile cards when enabled", () => {
    vi.mocked(useTableVirtualization).mockReturnValue({
      enabled: true,
      rows: [
        {
          row: { id: "b", name: "Bob" },
          index: 1,
          key: "b",
        } satisfies VirtualTableRow<Row>,
      ],
      paddingTop: 132,
      paddingBottom: 0,
      measureElement: vi.fn(),
    });
    renderHarness({
      isMobile: true,
      mode: "infinite",
      override: { virtualize: true, estimateCardSize: 132 },
    });
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
