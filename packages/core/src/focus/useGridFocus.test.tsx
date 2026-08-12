/**
 * The focus hook against a real DOM.
 *
 * The arithmetic is covered in `gridFocus.test.ts`; what matters here is
 * everything that only exists once something is rendered — that the DOM
 * actually follows the state, that the ARIA indices are absolute under
 * virtualization, that a cell the virtualizer has not mounted is still
 * reachable, and that omitting the prop leaves the markup untouched.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "../types";
import { type GridCell } from "./gridFocus";
import { useGridFocus } from "./useGridFocus";

interface Row {
  id: string;
  name: string;
  team: string;
}

const COLUMNS: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name },
  { key: "team", header: "Team", accessor: (row) => row.team },
];

function makeRows(count: number, from = 0): Row[] {
  return Array.from({ length: count }, (_, i) => ({
    id: String(from + i),
    name: `Name ${from + i}`,
    team: `Team ${from + i}`,
  }));
}

/** A table wired exactly the way an adapter wires it. */
function Grid(props: {
  enabled?: boolean;
  rowCount?: number;
  rows?: Row[];
  firstRowIndex?: number;
  dir?: "ltr" | "rtl";
  pageSize?: number;
  scrollToRow?: (row: number) => void;
  onActivate?: (cell: GridCell) => void;
  /** Render only the first N loaded rows — what a virtualizer does. */
  renderLimit?: number;
}) {
  const rows = props.rows ?? makeRows(3);
  const focus = useGridFocus<Row>({
    enabled: props.enabled ?? true,
    rowCount: props.rowCount ?? rows.length,
    columns: COLUMNS,
    rows,
    firstRowIndex: props.firstRowIndex,
    pageSize: props.pageSize,
    dir: props.dir,
    scrollToRow: props.scrollToRow,
    onActivate: props.onActivate,
  });
  const first = props.firstRowIndex ?? 0;
  const rendered =
    props.renderLimit === undefined ? rows : rows.slice(0, props.renderLimit);
  return (
    <>
      <table {...focus.getGridProps()}>
        <tbody>
          {rendered.map((row, i) => (
            <tr key={row.id} {...focus.getRowProps(first + i)}>
              {COLUMNS.map((column, col) => (
                <td
                  key={column.key}
                  {...focus.getCellProps({ row: first + i, col })}
                >
                  {column.accessor?.(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <output>{focus.announcement}</output>
    </>
  );
}

const cellAt = (row: number, col: number) =>
  document.querySelector<HTMLElement>(`[data-grid-cell="${row}:${col}"]`);

describe("useGridFocus", () => {
  it("makes the table one tab stop with the first cell tabbable", () => {
    render(<Grid />);
    expect(cellAt(0, 0)).toHaveAttribute("tabindex", "0");
    // Every other cell is out of the tab order, so Tab leaves the table.
    expect(cellAt(0, 1)).toHaveAttribute("tabindex", "-1");
    expect(cellAt(2, 1)).toHaveAttribute("tabindex", "-1");
  });

  it("moves the DOM focus, not just the state", () => {
    render(<Grid />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    expect(cellAt(1, 0)).toHaveFocus();
    fireEvent.keyDown(grid, { key: "ArrowRight" });
    expect(cellAt(1, 1)).toHaveFocus();
  });

  it("rotates the tab stop so only the focused cell is tabbable", () => {
    render(<Grid />);
    fireEvent.keyDown(screen.getByRole("grid"), { key: "ArrowDown" });
    expect(cellAt(1, 0)).toHaveAttribute("tabindex", "0");
    expect(cellAt(0, 0)).toHaveAttribute("tabindex", "-1");
  });

  it("swaps the arrows under RTL", () => {
    render(<Grid dir="rtl" />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowLeft" });
    // Left is visually forward in a mirrored table.
    expect(cellAt(0, 1)).toHaveFocus();
  });

  it("carries the dataset totals, not the rendered count", () => {
    // 24 rendered rows of a 100,000-row set — the virtualized case.
    render(
      <Grid
        rows={makeRows(24, 40000)}
        rowCount={100000}
        firstRowIndex={40000}
      />
    );
    const grid = screen.getByRole("grid");
    expect(grid).toHaveAttribute("aria-rowcount", "100000");
    expect(grid).toHaveAttribute("aria-colcount", "2");
  });

  it("numbers rows and columns absolutely, so row 40,001 says so", () => {
    render(
      <Grid
        rows={makeRows(24, 40000)}
        rowCount={100000}
        firstRowIndex={40000}
      />
    );
    const rows = screen.getAllByRole("row");
    // Not "1" — that is the bug this exists to prevent.
    expect(rows[0]).toHaveAttribute("aria-rowindex", "40001");
    expect(cellAt(40000, 0)).toHaveAttribute("aria-colindex", "1");
    expect(cellAt(40000, 1)).toHaveAttribute("aria-colindex", "2");
  });

  it("asks the virtualizer for a loaded row that is not mounted", () => {
    const scrollToRow = vi.fn();
    // 1,000 rows loaded, 24 mounted — the virtualized case. Ctrl+End addresses
    // the last LOADED row, which the virtualizer must bring into the DOM.
    render(
      <Grid
        rows={makeRows(1000, 0)}
        rowCount={100000}
        renderLimit={24}
        scrollToRow={scrollToRow}
        pageSize={24}
      />
    );
    fireEvent.keyDown(screen.getByRole("grid"), { key: "End", ctrlKey: true });
    expect(scrollToRow).toHaveBeenCalledWith(999);
  });

  it("never moves past the last loaded row, however large the dataset", () => {
    const scrollToRow = vi.fn();
    // 24 loaded of 100,000: row 99,999 sits on another page and is unreachable,
    // so moving there would announce a cell the user cannot see.
    render(
      <Grid
        rows={makeRows(24, 0)}
        rowCount={100000}
        scrollToRow={scrollToRow}
      />
    );
    fireEvent.keyDown(screen.getByRole("grid"), { key: "End", ctrlKey: true });
    expect(cellAt(23, 1)).toHaveFocus();
    expect(scrollToRow).toHaveBeenCalledWith(23);
  });

  it("focuses a cell once a later render mounts it", () => {
    // 100 rows loaded, 24 mounted. PageDown targets row 24 — loaded, so a legal
    // move, but not in the DOM yet.
    const { rerender } = render(
      <Grid
        rows={makeRows(100, 0)}
        rowCount={100}
        renderLimit={24}
        pageSize={24}
      />
    );
    fireEvent.keyDown(screen.getByRole("grid"), { key: "PageDown" });
    expect(cellAt(24, 0)).toBeNull();

    // The virtualizer scrolls; the mounted window now includes row 24.
    rerender(
      <Grid
        rows={makeRows(100, 0)}
        rowCount={100}
        renderLimit={40}
        pageSize={24}
      />
    );
    expect(cellAt(24, 0)).toHaveFocus();
  });

  it("announces the column, the cell's text and the absolute position", () => {
    render(
      <Grid
        rows={makeRows(24, 40000)}
        rowCount={100000}
        firstRowIndex={40000}
      />
    );
    fireEvent.keyDown(screen.getByRole("grid"), { key: "ArrowDown" });
    expect(screen.getByRole("status")).toHaveTextContent(
      "Name, Name 40001, row 40002 of 100000"
    );
  });

  it("hands Enter and F2 to the editing model", () => {
    const onActivate = vi.fn();
    render(<Grid onActivate={onActivate} />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowDown" });
    fireEvent.keyDown(grid, { key: "Enter" });
    expect(onActivate).toHaveBeenCalledWith({ row: 1, col: 0 });
    fireEvent.keyDown(grid, { key: "F2" });
    expect(onActivate).toHaveBeenCalledTimes(2);
  });

  it("stays silent until the grid is entered", () => {
    render(<Grid />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
  });

  it("enters at the first cell when a key arrives before any focus", () => {
    render(<Grid />);
    // ArrowUp from nowhere is still an entry: the user needs to hear where
    // they landed, even though the move itself had nowhere to go.
    fireEvent.keyDown(screen.getByRole("grid"), { key: "ArrowUp" });
    expect(cellAt(0, 0)).toHaveFocus();
    expect(screen.getByRole("status")).toHaveTextContent(
      "Name, Name 0, row 1 of 3"
    );
  });

  it("says nothing new when an edge move changes nothing", () => {
    render(<Grid />);
    const grid = screen.getByRole("grid");
    fireEvent.keyDown(grid, { key: "ArrowUp" });
    const entered = screen.getByRole("status").textContent;

    fireEvent.keyDown(grid, { key: "ArrowUp" });

    // Already at the top: focus holds and the live region is not re-announced,
    // so a held-down arrow does not chatter at the edge.
    expect(cellAt(0, 0)).toHaveFocus();
    expect(screen.getByRole("status").textContent).toBe(entered);
  });

  it("follows a click, so the mouse and the keyboard agree", () => {
    render(<Grid />);
    const target = cellAt(2, 1);
    if (!target) throw new Error("cell 2:1 should be rendered");
    fireEvent.focus(target);
    expect(target).toHaveAttribute("tabindex", "0");
    fireEvent.keyDown(screen.getByRole("grid"), { key: "ArrowUp" });
    expect(cellAt(1, 1)).toHaveFocus();
  });

  it("offsets the window with getCellPropsAt, so adapters pass what they have", () => {
    // An adapter maps source.rows and has index 0..23; the dataset row is
    // 40000..40023. Doing that arithmetic in eight adapters is how it goes
    // wrong, so the hook does it.
    function Windowed() {
      const rows = makeRows(24, 40000);
      const focus = useGridFocus<Row>({
        enabled: true,
        rowCount: 100000,
        columns: COLUMNS,
        rows,
        firstRowIndex: 40000,
      });
      return (
        <table {...focus.getGridProps()}>
          <tbody>
            {rows.map((row, i) => (
              <tr key={row.id} {...focus.getRowPropsAt(i)}>
                {COLUMNS.map((column, col) => (
                  <td key={column.key} {...focus.getCellPropsAt(i, col)}>
                    {column.accessor?.(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    render(<Windowed />);
    expect(screen.getAllByRole("row")[0]).toHaveAttribute(
      "aria-rowindex",
      "40001"
    );
    expect(cellAt(40000, 0)).not.toBeNull();
    expect(cellAt(0, 0)).toBeNull();
  });

  it("costs nothing when it is off — byte-identical markup", () => {
    const on = render(<Grid enabled={false} />);
    const off = on.container.innerHTML;
    on.unmount();

    // A plain table rendered with no focus props at all.
    function Plain() {
      const rows = makeRows(3);
      return (
        <>
          <table>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  {COLUMNS.map((column) => (
                    <td key={column.key}>{column.accessor?.(row)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <output />
        </>
      );
    }
    const plain = render(<Plain />);
    expect(off).toBe(plain.container.innerHTML);
  });

  it("ignores the keyboard entirely when it is off", () => {
    render(<Grid enabled={false} />);
    // No role="grid", so there is nothing to key against; the cells are not
    // tabbable and pressing a key changes nothing.
    expect(screen.queryByRole("grid")).toBeNull();
    expect(cellAt(0, 0)).toBeNull();
  });
});
