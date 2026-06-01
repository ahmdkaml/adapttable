/** Gap-fill: MUI select onChange handlers and chip delete. */
import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
import { createTheme, ThemeProvider } from "@mui/material";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

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
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
];
const theme = createTheme();

let adapter: ReturnType<typeof createMemoryAdapter>;

function mount(
  override: Partial<Parameters<typeof DataTable<Row>>[0]> = {},
  mode: "paged" | "infinite" = "paged",
  url = ""
) {
  adapter = createMemoryAdapter(url);
  function Harness() {
    const source = useFrontendData<Row>({
      data: ROWS,
      adapter,
      columns,
      paginationMode: mode,
    });
    return (
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        {...override}
      />
    );
  }
  render(
    <ThemeProvider theme={theme}>
      <Harness />
    </ThemeProvider>
  );
}

describe("MUI gaps", () => {
  it("sort-by select commits a sort", () => {
    mount({ sortByOptions: [{ value: "name", label: "Name" }] });
    fireEvent.mouseDown(screen.getByLabelText("Sort by"));
    const listbox = screen.getByRole("listbox");
    fireEvent.click(within(listbox).getByText("Name"));
    expect(adapter.getSearch()).toContain("sortBy=name");
  });

  it("rows-per-page select commits a new limit (infinite mode)", () => {
    mount({}, "infinite");
    fireEvent.mouseDown(screen.getByLabelText("Rows per page"));
    const listbox = screen.getByRole("listbox");
    fireEvent.click(within(listbox).getByText("50"));
    expect(adapter.getSearch()).toContain("limit=50");
  });

  it("deleting a chip clears its filter", () => {
    mount(
      { filterLabels: { status: (v) => `Status: ${v}` } },
      "paged",
      "f_status=Active"
    );
    const remove = screen.getByLabelText("Clear all: Status: Active");
    fireEvent.click(remove);
    expect(adapter.getSearch()).not.toContain("f_status");
  });

  it("clear-all link clears filters", () => {
    const onClearFilters = vi.fn();
    mount(
      { filterLabels: { status: (v) => `Status: ${v}` }, onClearFilters },
      "paged",
      "f_status=Active"
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("fires prefetch on desktop row hover", () => {
    const prefetch = vi.fn();
    mount({ prefetch });
    const cell = screen.getByText("Alice").closest("tr")!;
    fireEvent.mouseEnter(cell);
    expect(prefetch).toHaveBeenCalledWith(ROWS[0]);
  });

  it("renders a custom Cell and a center-aligned column", () => {
    const cellCols: ColumnDef<Row>[] = [
      {
        key: "name",
        header: "Name",
        align: "center",
        Cell: ({ row }) => <b data-testid="cell">{row.name.toUpperCase()}</b>,
      },
    ];
    mount({ columns: cellCols });
    expect(screen.getAllByTestId("cell")[0]).toHaveTextContent("ALICE");
  });
});
