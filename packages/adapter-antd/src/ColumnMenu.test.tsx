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

describe("antd ColumnMenu", () => {
  it("toggles visibility, pins, reorders, and resets", async () => {
    const layout = fakeLayout();
    render(<ColumnMenu allColumns={cols} layout={layout} labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
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

  it("closes on Escape and reports collapsed state on the trigger", async () => {
    render(
      <ColumnMenu allColumns={cols} layout={fakeLayout()} labels={labels} />
    );
    const trigger = screen.getByRole("button", { name: "Columns" });
    fireEvent.click(trigger);
    await screen.findByText("Reset columns");
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    // antd's Popover has no built-in Escape handling — the menu adds its own
    // document listener so keyboard users can dismiss it.
    fireEvent.keyDown(document, { key: "Escape" });
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  it("keeps the menu open for non-Escape keys", async () => {
    render(
      <ColumnMenu allColumns={cols} layout={fakeLayout()} labels={labels} />
    );
    const trigger = screen.getByRole("button", { name: "Columns" });
    fireEvent.click(trigger);
    await screen.findByText("Reset columns");
    // Arrow keys reorder columns inside the menu; they must not dismiss it.
    fireEvent.keyDown(document, { key: "ArrowDown" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  it("flips the popover to the start side under RTL", async () => {
    render(
      <ColumnMenu
        allColumns={cols}
        layout={fakeLayout()}
        labels={labels}
        dir="rtl"
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");
    // Under RTL the popover anchors bottomLeft (the start edge) so it opens
    // toward the content instead of off-screen.
    expect(
      document.querySelector(".ant-popover-placement-bottomLeft")
    ).not.toBeNull();
  });

  it("renders the hidden-column state (strike-through, eye-off, text button)", async () => {
    const layout = fakeLayout();
    layout.state = { hidden: ["b"], order: [], pinned: {}, widths: {} };
    layout.isHidden = (key) => key === "b";
    render(<ColumnMenu allColumns={cols} layout={layout} labels={labels} />);
    fireEvent.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    // The hidden column's eye toggle offers to show it.
    const hiddenEye = byLabel("Show column: Bravo");
    expect(hiddenEye).toHaveAttribute("aria-pressed", "false");
    // A visible column's eye toggle offers to hide it.
    expect(byLabel("Hide column: Alpha")).toHaveAttribute(
      "aria-pressed",
      "true"
    );

    fireEvent.click(hiddenEye);
    expect(layout.toggleVisible).toHaveBeenCalledWith("b");
  });
});
