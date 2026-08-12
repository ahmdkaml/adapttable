/**
 * The bar itself: what it shows, and the keys it answers.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FindBar } from "./FindBar";
import type { FindInTableState } from "./useFindInTable";

const state = (overrides?: Partial<FindInTableState>): FindInTableState => ({
  open: true,
  setOpen: vi.fn(),
  query: "ada",
  setQuery: vi.fn(),
  matches: [
    { row: 0, col: 0 },
    { row: 3, col: 1 },
  ],
  matchKeys: new Set(["0:0", "3:1"]),
  index: 0,
  current: { row: 0, col: 0 },
  next: vi.fn(),
  previous: vi.fn(),
  openBar: vi.fn(),
  ...overrides,
});

describe("FindBar", () => {
  it("renders nothing while it is closed", () => {
    const { container } = render(<FindBar find={state({ open: false })} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows where the walk is", () => {
    render(<FindBar find={state()} />);
    expect(screen.getByText("1 of 2")).toBeInTheDocument();
  });

  it("says so plainly when nothing matched", () => {
    render(
      <FindBar
        find={state({
          matches: [],
          index: -1,
          current: null,
          matchKeys: new Set(),
        })}
      />
    );
    expect(screen.getByText("No matches")).toBeInTheDocument();
    expect(screen.getByLabelText("Next match")).toBeDisabled();
  });

  it("takes focus, so the box the user opened is the box they type in", () => {
    render(<FindBar find={state()} />);
    expect(screen.getByLabelText("Find in table")).toHaveFocus();
  });

  it("types into the query", () => {
    const find = state();
    render(<FindBar find={find} />);
    fireEvent.change(screen.getByLabelText("Find in table"), {
      target: { value: "grace" },
    });
    expect(find.setQuery).toHaveBeenCalledWith("grace");
  });

  it("walks with Enter and Shift+Enter", () => {
    const find = state();
    render(<FindBar find={find} />);
    const input = screen.getByLabelText("Find in table");
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.keyDown(input, { key: "Enter", shiftKey: true });
    expect(find.next).toHaveBeenCalledOnce();
    expect(find.previous).toHaveBeenCalledOnce();
  });

  it("closes on Escape and on the close button", () => {
    const find = state();
    render(<FindBar find={find} />);
    fireEvent.keyDown(screen.getByLabelText("Find in table"), {
      key: "Escape",
    });
    fireEvent.click(screen.getByLabelText("Close find"));
    expect(find.setOpen).toHaveBeenCalledTimes(2);
    expect(find.setOpen).toHaveBeenLastCalledWith(false);
  });

  it("ignores keys it has no business with", () => {
    const find = state();
    render(<FindBar find={find} />);
    fireEvent.keyDown(screen.getByLabelText("Find in table"), { key: "a" });
    expect(find.next).not.toHaveBeenCalled();
    expect(find.setOpen).not.toHaveBeenCalled();
  });

  it("walks from its own buttons", () => {
    const find = state();
    render(<FindBar find={find} />);
    fireEvent.click(screen.getByLabelText("Next match"));
    fireEvent.click(screen.getByLabelText("Previous match"));
    expect(find.next).toHaveBeenCalledOnce();
    expect(find.previous).toHaveBeenCalledOnce();
  });

  it("takes every word from the labels", () => {
    render(
      <FindBar
        find={state()}
        labels={{
          findInTable: "Chercher",
          findMatchCount: (current, total) => `${current}/${total}`,
        }}
      />
    );
    expect(screen.getByLabelText("Chercher")).toBeInTheDocument();
    expect(screen.getByText("1/2")).toBeInTheDocument();
  });
});
