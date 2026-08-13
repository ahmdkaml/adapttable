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
    state: { hidden: [], order: [], pinned: { a: "start" }, widths: {} },
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
  reorderRow: "Reorder",
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
        <ColumnMenu
          allColumns={cols}
          layout={layout}
          labels={labels}
          onAutoSize={() => undefined}
        />
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
        <ColumnMenu
          allColumns={cols}
          layout={layout}
          labels={labels}
          onAutoSize={() => undefined}
        />
      </MantineProvider>
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");

    // visibility via the eye control (aria-label is the column name)
    fireEvent.click(byLabel("Hide column: Bravo"));
    expect(layout.toggleVisible).toHaveBeenCalledWith("b");

    // pin toggle: a is pinned to start → next click unpins; b is unpinned → pins to start
    fireEvent.click(byLabel("Unpin: Alpha"));
    expect(layout.setPinned).toHaveBeenCalledWith("a", undefined);
    fireEvent.click(byLabel("Pin to start: Bravo"));
    expect(layout.setPinned).toHaveBeenCalledWith("b", "start");

    // reorder via grip keyboard
    fireEvent.keyDown(byLabel("Move to start / Move to end: Alpha"), {
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
          onAutoSize={() => undefined}
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
    fireEvent.click(byLabel("Pin to end: Actions"));
    expect(layout.setPinned).toHaveBeenCalledWith("actions", "end");

    // No drag grip and no draggable row: the actions column always trails.
    expect(
      document.querySelector(
        '[aria-label="Move to start / Move to end: Actions"]'
      )
    ).toBeNull();
    expect(screen.getByText("Actions").closest("[draggable]")).toBeNull();
  });

  it("unpins a pinned actions column and re-shows a hidden one", async () => {
    const user = userEvent.setup();
    const layout = fakeLayout();
    layout.state = {
      hidden: ["actions"],
      order: [],
      pinned: { actions: "end" },
      widths: {},
    };
    layout.isHidden = (key) => key === "actions";
    render(
      <MantineProvider>
        <ColumnMenu
          allColumns={cols}
          onAutoSize={() => undefined}
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

  it("lists a leading reorder row with an eye and a start pin", async () => {
    const user = userEvent.setup();
    const layout = fakeLayout();
    render(
      <MantineProvider>
        <ColumnMenu
          allColumns={cols}
          layout={layout}
          labels={labels}
          hasRowReorder
          onAutoSize={() => undefined}
        />
      </MantineProvider>
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    await screen.findByText("Reset columns");
    expect(screen.getByText("Reorder")).toBeInTheDocument();
    fireEvent.click(byLabel("Hide column: Reorder"));
    expect(layout.toggleVisible).toHaveBeenCalledWith("reorder");
    fireEvent.click(byLabel("Pin to start: Reorder"));
    expect(layout.setPinned).toHaveBeenCalledWith("reorder", "start");
  });

  // Regression: the menu portals to <body>, so it does not inherit the
  // table's direction. Under an Arabic locale the grip and pin controls
  // stayed on the LTR sides while the table itself mirrored. Only Chakra
  // passed `dir` through; the rest silently dropped it.
  it("forwards dir to the portalled menu", async () => {
    const user = userEvent.setup();
    render(
      <MantineProvider>
        <ColumnMenu
          allColumns={cols}
          onAutoSize={() => undefined}
          layout={fakeLayout()}
          labels={labels}
          dir="rtl"
        />
      </MantineProvider>
    );
    await user.click(screen.getByRole("button", { name: "Columns" }));
    const reset = await screen.findByText("Reset columns");
    expect(reset.closest('[dir="rtl"]')).not.toBeNull();
  });
});
