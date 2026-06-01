/**
 * Gap-fill: mobile selection + row actions, footer interactions, and the
 * bulk disabled-reason path.
 */
import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
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
  { key: "name", header: "Name", accessor: (r) => r.name },
];

let adapter: ReturnType<typeof createMemoryAdapter>;

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
    fireEvent.click(screen.getByRole("button", { name: "‹" }));
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
});
