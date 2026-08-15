import type { SharedTableRenderProps } from "@adapttable/core/adapter";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DesktopTable } from "./components/DesktopTable";

interface Person {
  id: string;
  name: string;
  email: string;
}

const rows: Person[] = [
  { id: "1", name: "Alice", email: "alice@example.com" },
  { id: "2", name: "Bob", email: "bob@example.com" },
];

function makeProps(): SharedTableRenderProps<Person> {
  const columns = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
  ];

  return {
    table: {
      columns,
      getHeaderRowProps: () => ({}),
      getHeaderCellProps: () => ({}),
      getRowProps: () => ({}),
      getCellProps: () => ({}),
      getRowKey: (row: Person) => row.id,
      getCellContent: (column: (typeof columns)[number], row: Person) =>
        String(row[column.key as keyof Person] ?? ""),
    } as unknown as SharedTableRenderProps<Person>["table"],
    rows,
    confirm: () => undefined,
    getRowId: (row: Person) => row.id,
  };
}

describe("DesktopTable", () => {
  it("renders column headers", () => {
    const props = makeProps();
    const { rerender } = render(<DesktopTable {...props} />);

    expect(
      screen.getByRole("columnheader", { name: "Name" })
    ).toBeInTheDocument();

    expect(
      screen.getByRole("columnheader", { name: "Email" })
    ).toBeInTheDocument();

    rerender(<DesktopTable {...props} />);
  });

  it("renders row values", () => {
    render(<DesktopTable {...makeProps()} />);

    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("bob@example.com")).toBeInTheDocument();
  });

  it("renders an empty body when there are no rows", () => {
    render(<DesktopTable {...makeProps()} rows={[]} />);
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Name" })
    ).toBeInTheDocument();
  });

  it("uses the core cell renderer", () => {
    const props = makeProps();
    const getCellContent = vi.fn(props.table.getCellContent);

    render(
      <DesktopTable {...props} table={{ ...props.table, getCellContent }} />
    );

    expect(getCellContent).toHaveBeenCalled();
  });
});
