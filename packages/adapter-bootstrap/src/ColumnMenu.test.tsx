import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColumnMenu } from "./components/ColumnMenu";

interface Row {
  id: string;
}

const cols: ColumnDef<Row>[] = [
  { key: "a", header: "Alpha", accessor: (row) => row.id },
  { key: "b", header: "Bravo", accessor: (row) => row.id },
  { key: "c", header: "Charlie", accessor: (row) => row.id },
];

function fakeLayout(): UseColumnLayoutResult<Row> {
  return {
    state: {
      hidden: [],
      order: [],
      pinned: { a: "start" },
      widths: {},
    },
    visibleColumns: cols,
    isHidden: () => false,
    setHidden: vi.fn(),
    toggleVisible: vi.fn(),
    setPinned: vi.fn(),
    move: vi.fn(),
    setWidth: vi.fn(),
    pinOffset: () => undefined,
    reset: vi.fn(),
    toggleColumnGroup: vi.fn(),
  };
}

const labels = {
  columns: "Columns",
  pinStart: "Pin to start",
  pinEnd: "Pin to end",
  unpin: "Unpin",
  moveStart: "Move to start",
  moveEnd: "Move to end",
  resetColumns: "Reset columns",
  autoSizeColumns: "Size columns to content",
  autoSizeColumn: "Size column to content",
  showColumn: "Show column",
  hideColumn: "Hide column",
  searchColumns: "Search columns",
  showAllColumns: "Show all",
  hideAllColumns: "Hide all",
  unpinAllColumns: "Unpin all",
  resetColumn: "Reset column",
  sortAscending: "Sort ascending",
  sortDescending: "Sort descending",
  filterColumn: "Filter column",
  columnActions: "Column actions",
  actions: "Actions",
  reorderRow: "Reorder",
};

const byLabel = (name: string) =>
  document.querySelector<HTMLElement>(`[aria-label="${name}"]`)!;

describe("Bootstrap ColumnMenu", () => {
  it("toggles visibility, pins, reorders, and resets", () => {
    const layout = fakeLayout();

    render(
      <ColumnMenu
        allColumns={cols}
        layout={layout}
        labels={labels}
        onAutoSize={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Columns" }));

    expect(screen.getByText("Alpha")).toBeInTheDocument();
    expect(screen.getByText("Bravo")).toBeInTheDocument();

    fireEvent.click(byLabel("Hide column: Bravo"));
    expect(layout.toggleVisible).toHaveBeenCalledWith("b");

    fireEvent.click(byLabel("Unpin: Alpha"));
    expect(layout.setPinned).toHaveBeenCalledWith("a", undefined);

    fireEvent.click(byLabel("Pin to start: Bravo"));
    expect(layout.setPinned).toHaveBeenCalledWith("b", "start");

    fireEvent.keyDown(byLabel("Move to start / Move to end: Alpha"), {
      key: "ArrowRight",
    });
    expect(layout.move).toHaveBeenCalledWith("a", 1);

    fireEvent.click(screen.getByText("Reset columns"));
    expect(layout.reset).toHaveBeenCalled();
  });

  it("filters the column list", () => {
    render(
      <ColumnMenu
        allColumns={cols}
        layout={fakeLayout()}
        labels={labels}
        onAutoSize={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Columns" }));

    fireEvent.change(
      screen.getByRole("searchbox", { name: "Search columns" }),
      { target: { value: "bravo" } },
    );

    expect(screen.getByText("Bravo")).toBeInTheDocument();
    expect(screen.queryByText("Alpha")).not.toBeInTheDocument();
  });

  it("handles the actions column", () => {
    const layout = fakeLayout();

    render(
      <ColumnMenu
        allColumns={cols}
        layout={layout}
        labels={labels}
        hasRowActions
        onAutoSize={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Columns" }));

    expect(screen.getByText("Actions")).toBeInTheDocument();

    fireEvent.click(byLabel("Hide column: Actions"));
    expect(layout.toggleVisible).toHaveBeenCalledWith("actions");

    fireEvent.click(byLabel("Pin to end: Actions"));
    expect(layout.setPinned).toHaveBeenCalledWith("actions", "end");
  });

  it("handles the reorder column", () => {
    const layout = fakeLayout();

    render(
      <ColumnMenu
        allColumns={cols}
        layout={layout}
        labels={labels}
        hasRowReorder
        onAutoSize={() => undefined}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Columns" }));

    expect(screen.getByText("Reorder")).toBeInTheDocument();

    fireEvent.click(byLabel("Hide column: Reorder"));
    expect(layout.toggleVisible).toHaveBeenCalledWith("reorder");

    fireEvent.click(byLabel("Pin to start: Reorder"));
    expect(layout.setPinned).toHaveBeenCalledWith("reorder", "start");
  });
});
