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
