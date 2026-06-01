/** Gap-fill: footer prev, clear-all link, bulk clear. */
import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen } from "@testing-library/react";
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

let adapter: ReturnType<typeof createMemoryAdapter>;

function mount(
  override: Partial<Parameters<typeof DataTable<Row>>[0]> = {},
  url = ""
) {
  adapter = createMemoryAdapter(url);
  function Harness() {
    const source = useFrontendData<Row>({
      data: ROWS,
      adapter,
      columns,
      paginationMode: "paged",
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
    <ChakraProvider>
      <Harness />
    </ChakraProvider>
  );
}

describe("Chakra gaps", () => {
  it("footer previous button goes back a page", () => {
    mount({}, "limit=1&page=2");
    fireEvent.click(screen.getByRole("button", { name: "previous" }));
    expect(adapter.getSearch()).not.toContain("page=2");
  });

  it("clear-all chip link calls onClearFilters", () => {
    const onClearFilters = vi.fn();
    mount(
      { filterLabels: { status: (v) => `Status: ${v}` }, onClearFilters },
      "f_status=Active"
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("bulk bar Clear button drops the selection", () => {
    mount({ bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }] });
    fireEvent.click(screen.getByLabelText("Select all"));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.queryByText("2 selected")).toBeNull();
  });
});
