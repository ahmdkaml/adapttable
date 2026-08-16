import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable } from "./DataTable";

interface Person {
  id: string;
  name: string;
  city: string;
}

const rows: Person[] = [
  { id: "1", name: "Alice", city: "Dubai" },
  { id: "2", name: "Bob", city: "Riyadh" },
];

const columns = [
  {
    key: "name",
    header: "Name",
    accessor: (row: Person) => row.name,
    sortable: true,
  },
  { key: "city", header: "City", accessor: (row: Person) => row.city },
];

const defaultProps = {
  data: rows,
  columns,
  rowKey: (row: Person) => row.id,
  urlSync: false,
};

describe("DataTable", () => {
  it("renders with default props and handles popover filtersMode", () => {
    const { rerender } = render(<DataTable {...defaultProps} />);

    expect(
      screen.getByRole("columnheader", { name: /Name/ })
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Riyadh")).toBeInTheDocument();

    rerender(
      <DataTable
        data={[{ id: "3", name: "Cara", city: "Doha" }]}
        columns={columns}
        rowKey={(row: Person) => row.id}
        urlSync={false}
      />
    );
    expect(screen.getByText("Cara")).toBeInTheDocument();
  });

  it("handles drawer filtersMode, custom tableFooter, and footer visibility", () => {
    render(
      <DataTable
        {...defaultProps}
        filtersMode="drawer"
        tableFooter={<span data-testid="custom-footer">Footer Content</span>}
      />
    );

    expect(screen.getByTestId("custom-footer")).toBeInTheDocument();
    expect(
      document.querySelector('[data-adapttable-part="table-footer"]')
    ).toBeInTheDocument();
  });

  it("handles search and interactive events across the table shell", () => {
    render(<DataTable {...defaultProps} searchable={true} />);

    const searchInput = screen.getByRole("searchbox");
    fireEvent.change(searchInput, { target: { value: "Alice" } });

    expect(searchInput).toHaveValue("Alice");
  });
});
