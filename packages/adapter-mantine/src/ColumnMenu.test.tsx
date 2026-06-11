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
  actions: "Actions",
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
  it("shows drop-position feedback while dragging a row", async () => {
    const user = userEvent.setup();
    const layout = fakeLayout();
    render(
      <MantineProvider>
        <ColumnMenu allColumns={cols} layout={layout} labels={labels} />
      </MantineProvider>
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    const dt = {
      data: new Map<string, string>(),
      effectAllowed: "",
      dropEffect: "",
      get types() {
        return [...this.data.keys()];
      },
      setData(type: string, value: string) {
        this.data.set(type, value);
      },
      getData(type: string) {
        return this.data.get(type) ?? "";
      },
    };
    const rowOf = (name: string) =>
      screen.getByText(name).closest("[draggable]")!;
    fireEvent.dragStart(rowOf("Alpha"), { dataTransfer: dt });
    fireEvent.dragOver(rowOf("Charlie"), { dataTransfer: dt });
    // The source dims; the hovered target marks its landing edge.
    expect(rowOf("Alpha")).toHaveAttribute("data-dragging");
    expect(rowOf("Charlie")).toHaveAttribute("data-drop", "after");
    fireEvent.drop(rowOf("Charlie"), { dataTransfer: dt });
    expect(layout.move).toHaveBeenCalledWith("a", 2);
    expect(rowOf("Alpha")).not.toHaveAttribute("data-dragging");
    expect(rowOf("Charlie")).not.toHaveAttribute("data-drop");

    // Reverse drag: hovering an EARLIER row marks the "before" edge.
    fireEvent.dragStart(rowOf("Charlie"), { dataTransfer: dt });
    fireEvent.dragOver(rowOf("Alpha"), { dataTransfer: dt });
    expect(rowOf("Alpha")).toHaveAttribute("data-drop", "before");
    fireEvent.dragEnd(rowOf("Charlie"), { dataTransfer: dt });
    expect(rowOf("Alpha")).not.toHaveAttribute("data-drop");
  });

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

    // Without hasRowActions the menu never lists the actions column.
    expect(screen.queryByText("Actions")).toBeNull();
  });

  it("lists the actions column with eye + one-click end-pin toggles", async () => {
    const user = userEvent.setup();
    const layout = fakeLayout();
    render(
      <MantineProvider>
        <ColumnMenu
          allColumns={cols}
          layout={layout}
          labels={labels}
          hasRowActions
        />
      </MantineProvider>
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    // The actions row gets the same eye toggle as data rows…
    const eye = byLabel("Hide column: Actions");
    expect(eye).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(eye);
    expect(layout.toggleVisible).toHaveBeenCalledWith("actions");

    // …and a pin toggle that pins to the inline end in ONE click — no
    // left-pin stop in the cycle.
    fireEvent.click(byLabel("Pin right: Actions"));
    expect(layout.setPinned).toHaveBeenCalledWith("actions", "right");

    // No drag grip and no draggable row: the actions column always trails.
    expect(
      document.querySelector('[aria-label="Move left / Move right: Actions"]')
    ).toBeNull();
    expect(screen.getByText("Actions").closest("[draggable]")).toBeNull();
  });

  it("unpins a pinned actions column and re-shows a hidden one", async () => {
    const user = userEvent.setup();
    const layout = fakeLayout();
    layout.state = {
      hidden: ["actions"],
      order: [],
      pinned: { actions: "right" },
      widths: {},
    };
    layout.isHidden = (key) => key === "actions";
    render(
      <MantineProvider>
        <ColumnMenu
          allColumns={cols}
          layout={layout}
          labels={labels}
          hasRowActions
        />
      </MantineProvider>
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    const eye = byLabel("Show column: Actions");
    expect(eye).toHaveAttribute("aria-pressed", "false");
    fireEvent.click(eye);
    expect(layout.toggleVisible).toHaveBeenCalledWith("actions");

    // Pinned → one click unpins (right ↔ none, nothing in between).
    fireEvent.click(byLabel("Unpin: Actions"));
    expect(layout.setPinned).toHaveBeenCalledWith("actions", undefined);
  });
});
