import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import {
  buildBodyCells,
  cellsForRow,
  coveredAddressSet,
  resolveCellSpan,
  rowSpanSignature,
  spanningArmed,
} from "./cellSpan";

interface Person {
  id: string;
  name: string;
  team: string;
  city: string;
}

const COLUMNS: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name },
  { key: "team", header: "Team", accessor: (row) => row.team },
  { key: "city", header: "City", accessor: (row) => row.city },
];

const ROWS: Person[] = [
  { id: "a", name: "Ada", team: "Core", city: "London" },
  { id: "b", name: "Grace", team: "Core", city: "New York" },
  { id: "c", name: "Alan", team: "Labs", city: "Manchester" },
];

const id = (row: Person) => row.id;

describe("spanningArmed", () => {
  it("is off until a callback or a column asks", () => {
    expect(spanningArmed(COLUMNS, undefined)).toBe(false);
    expect(spanningArmed(COLUMNS, () => undefined)).toBe(true);
    expect(
      spanningArmed([{ ...COLUMNS[0]!, colSpan: 2 }, COLUMNS[1]!], undefined)
    ).toBe(true);
  });
});

describe("resolveCellSpan", () => {
  it("clamps to what is left of the grid and treats junk as 1", () => {
    const args = {
      row: ROWS[0]!,
      column: COLUMNS[0]!,
      rowIndex: 0,
      columnIndex: 0,
    };
    expect(
      resolveCellSpan(args, () => ({ colSpan: 9, rowSpan: 9 }), 3, 2)
    ).toEqual({
      colSpan: 3,
      rowSpan: 2,
    });
    expect(
      resolveCellSpan(args, () => ({ colSpan: 0, rowSpan: -2 }), 3, 2)
    ).toEqual({
      colSpan: 1,
      rowSpan: 1,
    });
  });

  it("reads column.colSpan / rowSpan when the callback is silent", () => {
    const column: ColumnDef<Person> = {
      ...COLUMNS[0]!,
      colSpan: 2,
      rowSpan: (row) => (row.id === "a" ? 2 : 1),
    };
    expect(
      resolveCellSpan(
        { row: ROWS[0]!, column, rowIndex: 0, columnIndex: 0 },
        undefined,
        3,
        3
      )
    ).toEqual({ colSpan: 2, rowSpan: 2 });
  });
});

describe("buildBodyCells", () => {
  it("is one cell per column when nothing spans", () => {
    const map = buildBodyCells({ rows: ROWS, columns: COLUMNS, getRowId: id });
    expect(cellsForRow(map, "a").map((cell) => cell.column.key)).toEqual([
      "name",
      "team",
      "city",
    ]);
    expect(cellsForRow(map, "a").every((cell) => cell.colSpan === 1)).toBe(
      true
    );
  });

  it("omits covered cells and keeps the origin", () => {
    const map = buildBodyCells({
      rows: ROWS,
      columns: COLUMNS,
      getRowId: id,
      getCellSpan: ({ column, rowIndex }) =>
        column.key === "name" && rowIndex === 0 ? { colSpan: 2 } : undefined,
    });
    expect(cellsForRow(map, "a").map((cell) => cell.column.key)).toEqual([
      "name",
      "city",
    ]);
    expect(cellsForRow(map, "a")[0]?.colSpan).toBe(2);
    expect(cellsForRow(map, "b").map((cell) => cell.column.key)).toEqual([
      "name",
      "team",
      "city",
    ]);
  });

  it("omits a cell covered by a row span", () => {
    const map = buildBodyCells({
      rows: ROWS,
      columns: COLUMNS,
      getRowId: id,
      getCellSpan: ({ column, row }) =>
        column.key === "team" && row.team === "Core" && row.id === "a"
          ? { rowSpan: 2 }
          : undefined,
    });
    expect(cellsForRow(map, "a").map((cell) => cell.column.key)).toEqual([
      "name",
      "team",
      "city",
    ]);
    expect(cellsForRow(map, "a")[1]?.rowSpan).toBe(2);
    expect(cellsForRow(map, "b").map((cell) => cell.column.key)).toEqual([
      "name",
      "city",
    ]);
  });

  it("clips a column span at a pin boundary", () => {
    const map = buildBodyCells({
      rows: [ROWS[0]!],
      columns: COLUMNS,
      getRowId: id,
      getCellSpan: ({ column }) =>
        column.key === "name" ? { colSpan: 3 } : undefined,
      pinOffset: (key) =>
        key === "name" ? { side: "start", inset: 0 } : undefined,
    });
    expect(cellsForRow(map, "a")[0]?.colSpan).toBe(1);
    expect(cellsForRow(map, "a").map((cell) => cell.column.key)).toEqual([
      "name",
      "team",
      "city",
    ]);
  });

  it("continues a span that starts outside the column window", () => {
    const map = buildBodyCells({
      rows: [ROWS[0]!],
      columns: COLUMNS,
      getRowId: id,
      getCellSpan: ({ column }) =>
        column.key === "name" ? { colSpan: 3 } : undefined,
      windowKeys: new Set(["team", "city"]),
    });
    const cells = cellsForRow(map, "a");
    expect(cells).toHaveLength(1);
    expect(cells[0]?.column.key).toBe("team");
    expect(cells[0]?.colSpan).toBe(2);
    expect(cells[0]?.columnIndex).toBe(1);
  });
});

describe("coveredAddressSet", () => {
  it("names every covered address and never the origin", () => {
    const covered = coveredAddressSet({
      rows: ROWS,
      columns: COLUMNS,
      firstRowIndex: 10,
      getCellSpan: ({ column, rowIndex }) =>
        column.key === "name" && rowIndex === 10
          ? { colSpan: 2, rowSpan: 2 }
          : undefined,
    });
    expect(covered.has("10:0")).toBe(false);
    expect(covered.has("10:1")).toBe(true);
    expect(covered.has("11:0")).toBe(true);
    expect(covered.has("11:1")).toBe(true);
    expect(covered.has("11:2")).toBe(false);
  });
});

describe("rowSpanSignature", () => {
  it("is empty without cells and joins spans when present", () => {
    expect(rowSpanSignature(undefined)).toBe("");
    const map = buildBodyCells({
      rows: [ROWS[0]!],
      columns: COLUMNS,
      getRowId: id,
      getCellSpan: ({ column }) =>
        column.key === "name" ? { colSpan: 2 } : undefined,
    });
    expect(rowSpanSignature(cellsForRow(map, "a"))).toBe("name:2x1,city:1x1");
  });
});
