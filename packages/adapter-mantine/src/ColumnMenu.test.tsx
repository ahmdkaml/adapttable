import type { ColumnDef, UseColumnLayoutResult } from "@adapttable/core";
import { MantineProvider } from "@mantine/core";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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
  showColumn: "Show column",
  hideColumn: "Hide column",
};

// Mantine renders the dropdown in a portal whose buttons testing-library's
// role query treats as hidden mid-transition; query by aria-label directly.
const byLabel = (name: string) =>
  document.querySelector<HTMLElement>(`[aria-label="${name}"]`)!;

describe("mantine ColumnMenu", () => {
  it("toggles visibility, pins, reorders, and resets", async () => {
    const user = userEvent.setup();
    const layout = fakeLayout();
    render(
      <MantineProvider>
        <ColumnMenu allColumns={cols} layout={layout} labels={labels} />
      </MantineProvider>
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    // visibility via the eye control (aria-label is the column name)
    fireEvent.click(byLabel("Hide column: Bravo"));
    expect(layout.toggleVisible).toHaveBeenCalledWith("b");

    // pin cycle: a is pinned left → next is right; b is unpinned → pins left
    fireEvent.click(byLabel("Pin right: Alpha"));
    expect(layout.setPinned).toHaveBeenCalledWith("a", "right");
    fireEvent.click(byLabel("Pin left: Bravo"));
    expect(layout.setPinned).toHaveBeenCalledWith("b", "left");

    // reorder via grip keyboard
    fireEvent.keyDown(byLabel("Move left / Move right: Alpha"), {
      key: "ArrowRight",
    });
    expect(layout.move).toHaveBeenCalledWith("a", 1);

    fireEvent.click(screen.getByText("Reset columns"));
    expect(layout.reset).toHaveBeenCalled();
  });
});
