import { render, screen } from "@testing-library/react";
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
  { key: "name", header: "Name", accessor: (row: Person) => row.name },
  { key: "city", header: "City", accessor: (row: Person) => row.city },
];

describe("DataTable", () => {
  it("renders rows and columns", () => {
    const { rerender } = render(
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        urlSync={false}
      />
    );

    expect(
      screen.getByRole("columnheader", { name: "Name" })
    ).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Riyadh")).toBeInTheDocument();

    rerender(
      <DataTable
        data={rows}
        columns={columns}
        rowKey={(row) => row.id}
        urlSync={false}
      />
    );
    rerender(
      <DataTable
        data={[{ id: "3", name: "Cara", city: "Doha" }]}
        columns={columns}
        rowKey={(row) => row.id}
        urlSync={false}
      />
    );
    expect(screen.getByText("Cara")).toBeInTheDocument();
  });
});
