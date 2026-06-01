import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
import { createTheme, ThemeProvider } from "@mui/material";
import { act, fireEvent, render, screen } from "@testing-library/react";
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
const theme = createTheme();

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
    <ThemeProvider theme={theme}>
      <Harness {...props} />
    </ThemeProvider>
  );
}

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("<DataTable> (MUI)", () => {
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

  it("commits debounced search to the URL", () => {
    renderHarness();
    fireEvent.change(screen.getByLabelText("Search"), {
      target: { value: "ali" },
    });
    act(() => vi.advanceTimersByTime(300));
    expect(adapter.getSearch()).toContain("q=ali");
  });

  it("cycles sort on a header label", () => {
    renderHarness();
    fireEvent.click(screen.getByText("Name"));
    expect(adapter.getSearch()).toContain("sortDir=asc");
    fireEvent.click(screen.getByText("Name"));
    expect(adapter.getSearch()).toContain("sortDir=desc");
  });

  it("paginates via the MUI pager", () => {
    renderHarness({}, "limit=1");
    fireEvent.click(screen.getByRole("button", { name: /go to page 2/i }));
    expect(adapter.getSearch()).toContain("page=2");
  });

  it("runs a bulk action after confirm", () => {
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
    fireEvent.click(screen.getByText("Delete"));
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

  it("renders mobile cards when isMobile", () => {
    renderHarness({ isMobile: true });
    // Cards, not a <table>.
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("runs a row action without confirm immediately", () => {
    const onClick = vi.fn();
    renderHarness({
      override: { rowActions: [{ key: "e", label: "Edit", onClick }] },
    });
    fireEvent.click(screen.getAllByRole("button", { name: "Edit" })[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("applies className and dir", () => {
    const { container } = renderHarness({
      override: { className: "my-root", dir: "rtl" },
    });
    const root = container.querySelector(".my-root");
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("dir", "rtl");
  });

  it("shows rows-per-page in infinite mode and a sort select with options", () => {
    renderHarness({
      mode: "infinite",
      override: { sortByOptions: [{ value: "name", label: "Name" }] },
    });
    expect(screen.getAllByLabelText(/rows per page/i).length).toBeGreaterThan(
      0
    );
    expect(screen.getAllByLabelText(/sort by/i).length).toBeGreaterThan(0);
  });

  it("renders a slots.empty override", () => {
    renderHarness({
      rows: [],
      override: { slots: { empty: <div>nada</div> } },
    });
    expect(screen.getByText("nada")).toBeInTheDocument();
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

  it("mobile: selection + row actions work", () => {
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

  it("bulk action with a disabledReason is disabled", () => {
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

  it("loads more rows via the Load more button in infinite mode", () => {
    renderHarness({ mode: "infinite" }, "limit=1");
    expect(screen.queryByText("Bob")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /load more/i }));
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

});
