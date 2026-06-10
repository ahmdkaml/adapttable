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
  showColumn: "Show column",
  hideColumn: "Hide column",
};

const byLabel = (name: string) =>
  document.querySelector<HTMLElement>(`[aria-label="${name}"]`)!;

describe("mui ColumnMenu", () => {
  it("toggles visibility, pins, reorders, and resets", async () => {
    const layout = fakeLayout();
    render(<ColumnMenu allColumns={cols} layout={layout} labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    // visibility via the eye control (verb-prefixed accessible name)
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

  it("renders a hidden column with strike-through and disabled colors", async () => {
    const layout = fakeLayout();
    // `r.hidden` is derived from `layout.isHidden(key)`; mark "b" hidden so the
    // hidden-side branches (eye color, text color, line-through) are exercised.
    layout.isHidden = (key) => key === "b";
    render(<ColumnMenu allColumns={cols} layout={layout} labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    const bravo = screen.getByText("Bravo");
    expect(bravo).toHaveStyle({ textDecoration: "line-through" });
    // The eye toggle for a hidden column offers to show it.
    expect(byLabel("Show column: Bravo")).toHaveAttribute(
      "aria-pressed",
      "false"
    );
    // A visible column offers to hide it.
    expect(byLabel("Hide column: Charlie")).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });
});
