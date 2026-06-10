import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { rowClickProps } from "./rowClickProps";

const ROW = { id: "a", name: "Alice" };

describe("rowClickProps", () => {
  it("returns undefined without a handler so spreads are unconditional", () => {
    expect(rowClickProps(ROW, undefined)).toBeUndefined();
  });

  it("activates on a plain row click with the pointer affordance", () => {
    const onRowClick = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr data-testid="row" {...rowClickProps(ROW, onRowClick)}>
            <td>Alice</td>
          </tr>
        </tbody>
      </table>
    );
    const row = screen.getByTestId("row");
    expect(row).toHaveStyle({ cursor: "pointer" });
    fireEvent.click(screen.getByText("Alice"));
    expect(onRowClick).toHaveBeenCalledWith(ROW);
  });

  it("never activates from interactive children — their behaviour wins", () => {
    const onRowClick = vi.fn();
    const onAction = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr {...rowClickProps(ROW, onRowClick)}>
            <td>
              <button type="button" onClick={onAction}>
                Delete
              </button>
              <input aria-label="Select row" type="checkbox" />
              <a href="#x">Open</a>
            </td>
          </tr>
        </tbody>
      </table>
    );
    fireEvent.click(screen.getByRole("button", { name: "Delete" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "Select row" }));
    fireEvent.click(screen.getByRole("link", { name: "Open" }));
    expect(onAction).toHaveBeenCalled();
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("activates on Enter only when the row itself has focus", () => {
    const onRowClick = vi.fn();
    render(
      <table>
        <thead>
          <tr>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          <tr
            data-testid="row"
            tabIndex={0}
            {...rowClickProps(ROW, onRowClick)}
          >
            <td>
              <button type="button">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    );
    const row = screen.getByTestId("row");
    fireEvent.keyDown(row, { key: "Enter" });
    expect(onRowClick).toHaveBeenCalledTimes(1);
    // Enter on a child button must not double-activate the row.
    fireEvent.keyDown(screen.getByRole("button"), { key: "Enter" });
    expect(onRowClick).toHaveBeenCalledTimes(1);
    fireEvent.keyDown(row, { key: "a" });
    expect(onRowClick).toHaveBeenCalledTimes(1);
  });
});
