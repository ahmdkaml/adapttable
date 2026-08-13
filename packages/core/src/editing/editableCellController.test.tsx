import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "../types";
import {
  editableCellController,
  rowEditingSignature,
} from "./editableCellController";
import { useCellEditing } from "./useCellEditing";

interface Person {
  id: string;
  name: string;
  age: number;
}

const ROWS: Person[] = [
  { id: "1", name: "Ada", age: 36 },
  { id: "2", name: "Grace", age: 85 },
];

const COLS: ColumnDef<Person>[] = [
  { key: "name", editable: true },
  { key: "age", editable: true, editor: "number", sortValue: (r) => r.age },
  { key: "id" },
];

describe("editableCellController", () => {
  it("stays display-only when editing is undefined (opt-out)", () => {
    const ctrl = editableCellController({
      editing: undefined,
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(ctrl.mode).toBe("display");
    ctrl.begin();
    expect(ctrl.mode).toBe("display");
  });

  it("is activatable for editable columns when onCellEdit is set", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    const ctrl = editableCellController({
      editing: { onCellEdit, state: result.current },
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(ctrl.mode).toBe("activatable");
    expect(ctrl.editor).toBe("text");
  });

  it("is display for non-editable columns even with onCellEdit", () => {
    const { result } = renderHook(() => useCellEditing());
    const ctrl = editableCellController({
      editing: { onCellEdit: vi.fn(), state: result.current },
      row: ROWS[0]!,
      column: COLS[2]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(ctrl.mode).toBe("display");
  });

  it("enters editing, commits on Enter via onCellEdit", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => {
      editableCellController({
        editing: { onCellEdit, state: result.current },
        row: ROWS[0]!,
        column: COLS[0]!,
        rowId: "1",
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
      }).begin();
    });
    const editingCtrl = editableCellController({
      editing: { onCellEdit, state: result.current },
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    expect(editingCtrl.mode).toBe("editing");
    act(() => editingCtrl.setDraft("Augusta"));
    act(() =>
      editingCtrl.onEditorKeyDown({
        key: "Enter",
        preventDefault: () => undefined,
      })
    );
    expect(onCellEdit).toHaveBeenCalledWith(ROWS[0], "name", "Augusta");
    expect(result.current.active).toBeNull();
  });
});

describe("rowEditingSignature", () => {
  it("is null when editing is off (opt-out DNA)", () => {
    expect(rowEditingSignature(undefined, "1")).toBeNull();
  });

  it("fingerprints only the active row's draft", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "1")
    ).toBe("");
    act(() => result.current.begin("1", "name", "Ada"));
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "1")
    ).toBe("name:Ada");
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "2")
    ).toBe("");
    act(() => result.current.setDraft("Augusta"));
    expect(
      rowEditingSignature({ onCellEdit, state: result.current }, "1")
    ).toBe("name:Augusta");
  });
});

/**
 * The paths a cell leaves an edit by, other than Enter: Tab (commit and open
 * the next cell), Escape (throw the draft away), and a click somewhere else.
 * Each of the three has to reach the host exactly once — or not at all.
 */
describe("editableCellController — leaving an edit", () => {
  /** A controller for one cell, against a live editing state. */
  const controllerFor = (
    state: ReturnType<typeof useCellEditing>,
    onCellEdit: (row: Person, key: string, next: unknown) => void,
    rowIndex = 0,
    colIndex = 0
  ) =>
    editableCellController({
      editing: { onCellEdit, state },
      row: ROWS[rowIndex]!,
      column: COLS[colIndex]!,
      rowId: ROWS[rowIndex]!.id,
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });

  const press = (key: string, shiftKey = false) => ({
    key,
    shiftKey,
    preventDefault: () => undefined,
  });

  it("commits on Tab and opens the next cell in the row", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      result.current.setDraft("Ada L");
    });
    act(() => {
      controllerFor(result.current, onCellEdit).onEditorKeyDown(press("Tab"));
    });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "name",
      "Ada L"
    );
    // The edit moved on rather than closing: the next column is now active.
    expect(result.current.isActive("1", "age")).toBe(true);
  });

  it("commits on Shift+Tab and opens the previous cell", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit, 0, 1).begin();
    });
    act(() => {
      controllerFor(result.current, onCellEdit, 0, 1).onEditorKeyDown(
        press("Tab", true)
      );
    });
    expect(result.current.isActive("1", "name")).toBe(true);
  });

  it("throws the draft away on Escape without telling the host", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      result.current.setDraft("nope");
    });
    act(() => {
      controllerFor(result.current, onCellEdit).onEditorKeyDown(
        press("Escape")
      );
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.isActive("1", "name")).toBe(false);
  });

  it("ignores keys it has no meaning for", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      controllerFor(result.current, onCellEdit).onEditorKeyDown(press("a"));
    });
    expect(onCellEdit).not.toHaveBeenCalled();
    expect(result.current.isActive("1", "name")).toBe(true);
  });

  it("commits when the reader clicks away", () => {
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      result.current.setDraft("Ada Lovelace");
    });
    act(() => {
      controllerFor(result.current, onCellEdit).commitOnBlur();
    });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "name",
      "Ada Lovelace"
    );
  });

  it("does nothing on the blur of a cell that was not the open one", () => {
    // Every cell wires `commitOnBlur`; only the active one may commit, or a
    // click-away would write through every cell in the row.
    const { result } = renderHook(() => useCellEditing());
    const onCellEdit = vi.fn();
    act(() => {
      controllerFor(result.current, onCellEdit).begin();
    });
    act(() => {
      controllerFor(result.current, onCellEdit, 1).commitOnBlur();
    });
    expect(onCellEdit).not.toHaveBeenCalled();
  });

  it("has inert actions when the host never opted in", () => {
    // The display-only controller is handed to every cell of a table with no
    // `onCellEdit`; calling its actions must be safe.
    const ctrl = editableCellController({
      editing: undefined,
      row: ROWS[0]!,
      column: COLS[0]!,
      rowId: "1",
      rows: ROWS,
      columns: COLS,
      rowKey: (r) => r.id,
    });
    ctrl.setDraft("x");
    ctrl.onEditorKeyDown(press("Enter"));
    ctrl.commitOnBlur();
    expect(ctrl.draft).toBe("");
    expect(ctrl.mode).toBe("display");
  });
});
