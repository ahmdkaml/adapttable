import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ColumnMenu } from "./components/ColumnMenu";

interface Row {
  id: string;
}
const cols: ColumnDef<Row>[] = [
  { key: "a", header: "Alpha", accessor: (r) => r.id },
  { key: "b", header: "Bravo", accessor: (r) => r.id },
  { key: "c", header: "Charlie", accessor: (r) => r.id },
];

function fakeLayout(): UseColumnLayoutResult<Row> {
  return {
    state: { hidden: [], order: [], pinned: { a: "left" }, widths: {} },
    visibleColumns: cols,
    isHidden: () => false,
    setHidden: vi.fn(),
    toggleVisible: vi.fn(),
    setPinned: vi.fn(),
    move: vi.fn(),
    setWidth: vi.fn(),
    pinOffset: () => undefined,
    reset: vi.fn(),
  };
}

const labels = {
  columns: "Columns",
  pinLeft: "Pin left",
  pinRight: "Pin right",
  unpin: "Unpin",
  moveLeft: "Move left",
  moveRight: "Move right",
  resetColumns: "Reset columns",
};

function open(layout: UseColumnLayoutResult<Row>) {
  render(
    <ColumnMenu
      allColumns={cols}
      layout={layout}
      labels={labels}
      classNames={{}}
    />
  );
  fireEvent.click(screen.getByRole("button", { name: "Columns" }));
}

describe("unstyled ColumnMenu", () => {
  it("toggles visibility, pins, reorders, and resets", () => {
    const layout = fakeLayout();
    open(layout);
    // visibility
    fireEvent.click(screen.getAllByRole("checkbox")[1]!);
    expect(layout.toggleVisible).toHaveBeenCalledWith("b");
    // pin (column a is already pinned left → its left control unpins)
    fireEvent.click(screen.getByRole("button", { name: "Unpin: Alpha" }));
    expect(layout.setPinned).toHaveBeenCalledWith("a", undefined);
    fireEvent.click(screen.getByRole("button", { name: "Pin right: Bravo" }));
    expect(layout.setPinned).toHaveBeenCalledWith("b", "right");
    // reorder
    fireEvent.click(screen.getByRole("button", { name: "Move right: Alpha" }));
    expect(layout.move).toHaveBeenCalledWith("a", 1);
    fireEvent.click(screen.getByRole("button", { name: "Move left: Bravo" }));
    expect(layout.move).toHaveBeenCalledWith("b", 0);
    // reset
    fireEvent.click(screen.getByRole("button", { name: "Reset columns" }));
    expect(layout.reset).toHaveBeenCalled();
  });

  it("disables move-left on the first and move-right on the last column", () => {
    open(fakeLayout());
    expect(
      screen.getByRole("button", { name: "Move left: Alpha" })
    ).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Move right: Charlie" })
    ).toBeDisabled();
  });

  it("closes when the trigger is toggled again", () => {
    open(fakeLayout());
    expect(screen.getByRole("menu")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    expect(screen.queryByRole("menu")).toBeNull();
  });
});
