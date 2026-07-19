import { describe, expect, it, vi } from "vitest";

import type { ColumnDef } from "../types";
import {
  applyCellEditCommit,
  hasEditableColumns,
  isCellEditable,
  nextEditableCell,
  normalizeEditorOptions,
  parseCellEditValue,
  readEditableCellValue,
  resolveCellEditor,
  stepEditableCell,
} from "./cellEditing";

interface Person {
  id: string;
  name: string;
  age: number;
  status: string;
  salary: number;
}

const ROWS: Person[] = [
  { id: "1", name: "Ada", age: 36, status: "active", salary: 120_000 },
  { id: "2", name: "Grace", age: 85, status: "retired", salary: 0 },
  { id: "3", name: "Alan", age: 41, status: "active", salary: 95_000 },
];

const COLS: ColumnDef<Person>[] = [
  { key: "name", editable: true },
  { key: "age", editable: true, editor: "number", sortValue: (r) => r.age },
  {
    key: "status",
    editable: (row) => row.status !== "retired",
    editor: {
      type: "select",
      options: [
        { value: "active", label: "Active" },
        { value: "retired", label: "Retired" },
      ],
    },
  },
  {
    key: "salary",
    editable: true,
    editor: "number",
    editValue: (r) => String(r.salary),
    accessor: (r) => `$${r.salary}`,
  },
  { key: "id" },
];

describe("hasEditableColumns / isCellEditable", () => {
  it("is false when nothing opts in", () => {
    expect(hasEditableColumns([{ key: "id" }])).toBe(false);
    expect(isCellEditable(COLS[4]!, ROWS[0]!)).toBe(false);
  });

  it("respects boolean and predicate forms", () => {
    expect(hasEditableColumns(COLS)).toBe(true);
    expect(isCellEditable(COLS[0]!, ROWS[0]!)).toBe(true);
    expect(isCellEditable(COLS[2]!, ROWS[0]!)).toBe(true);
    expect(isCellEditable(COLS[2]!, ROWS[1]!)).toBe(false);
  });
});

describe("resolveCellEditor / normalizeEditorOptions", () => {
  it("defaults to text and returns null when not editable", () => {
    expect(resolveCellEditor(COLS[0]!)).toBe("text");
    expect(resolveCellEditor(COLS[1]!)).toBe("number");
    expect(resolveCellEditor(COLS[4]!)).toBeNull();
  });

  it("normalizes string select options", () => {
    expect(normalizeEditorOptions(["a", "b"])).toEqual([
      { value: "a", label: "a" },
      { value: "b", label: "b" },
    ]);
    expect(normalizeEditorOptions([{ value: "x", label: "X" }])).toEqual([
      { value: "x", label: "X" },
    ]);
  });
});

describe("readEditableCellValue / parseCellEditValue", () => {
  it("prefers editValue, then sortValue, then the key path", () => {
    expect(readEditableCellValue(ROWS[0]!, COLS[3]!)).toBe("120000");
    expect(readEditableCellValue(ROWS[0]!, COLS[1]!)).toBe("36");
    expect(readEditableCellValue(ROWS[0]!, COLS[0]!)).toBe("Ada");
  });

  it("parses number drafts and leaves text as-is", () => {
    expect(parseCellEditValue("number", "42")).toBe(42);
    expect(parseCellEditValue("number", "  ")).toBeNull();
    expect(parseCellEditValue("number", "nope")).toBeNull();
    expect(parseCellEditValue("text", "hello")).toBe("hello");
    expect(parseCellEditValue({ type: "select", options: ["a"] }, "a")).toBe(
      "a"
    );
  });
});

describe("stepEditableCell", () => {
  it("advances across columns then rows", () => {
    expect(
      nextEditableCell({
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
        from: { rowId: "1", columnKey: "name" },
      })
    ).toEqual({ rowId: "1", columnKey: "age" });

    expect(
      stepEditableCell({
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
        from: { rowId: "1", columnKey: "status" },
        direction: 1,
      })
    ).toEqual({ rowId: "1", columnKey: "salary" });
  });

  it("skips cells that fail the editable predicate", () => {
    expect(
      stepEditableCell({
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
        from: { rowId: "2", columnKey: "age" },
        direction: 1,
      })
    ).toEqual({ rowId: "2", columnKey: "salary" });
  });

  it("goes previous with direction -1 and wraps", () => {
    expect(
      stepEditableCell({
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
        from: { rowId: "1", columnKey: "name" },
        direction: -1,
      })
    ).toEqual({ rowId: "3", columnKey: "salary" });
  });

  it("returns null when there is nowhere to go", () => {
    expect(
      nextEditableCell({
        rows: [],
        columns: COLS,
        rowKey: (r) => r.id,
        from: { rowId: "1", columnKey: "name" },
      })
    ).toBeNull();

    expect(
      nextEditableCell({
        rows: [ROWS[0]!],
        columns: [{ key: "name", editable: true }],
        rowKey: (r) => r.id,
        from: { rowId: "1", columnKey: "name" },
      })
    ).toBeNull();
  });
});

describe("applyCellEditCommit", () => {
  it("parses and forwards to onCellEdit", () => {
    const onCellEdit = vi.fn();
    expect(
      applyCellEditCommit({
        commit: { rowId: "1", columnKey: "age", draft: "40" },
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
        onCellEdit,
      })
    ).toBe(true);
    expect(onCellEdit).toHaveBeenCalledWith(ROWS[0], "age", 40);
  });

  it("returns false for a stale row or column", () => {
    const onCellEdit = vi.fn();
    expect(
      applyCellEditCommit({
        commit: { rowId: "missing", columnKey: "age", draft: "1" },
        rows: ROWS,
        columns: COLS,
        rowKey: (r) => r.id,
        onCellEdit,
      })
    ).toBe(false);
    expect(onCellEdit).not.toHaveBeenCalled();
  });
});
