/**
 * A column's cell as text.
 *
 * The reason this exists is that `accessor` returns JSX, so the interesting
 * cases are the ones where the rendered cell is a React element and something
 * still has to say the cell out loud.
 */
import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import { columnText } from "./columnText";

interface Row {
  id: string;
  name: string;
  budget: number;
  active: boolean;
  due: Date;
  nested: { city: string };
  missing?: string;
}

const ROW: Row = {
  id: "1",
  name: "Ada",
  budget: 1240,
  active: true,
  due: new Date("2026-08-12T09:30:00.000Z"),
  nested: { city: "London" },
};

describe("columnText", () => {
  it("uses formatValue when the column states its own text", () => {
    const column: ColumnDef<Row> = {
      key: "budget",
      formatValue: () => "$1,240.00",
      exportValue: (row) => row.budget,
    };
    expect(columnText(column, ROW)).toBe("$1,240.00");
  });

  it("reads a JSX cell through exportValue, which accessor cannot give", () => {
    const column: ColumnDef<Row> = {
      key: "budget",
      // A real cell: an element, so there is no text in it at all.
      accessor: () => ({ type: "span", props: {} }) as never,
      exportValue: (row) => row.budget,
    };
    expect(columnText(column, ROW)).toBe("1240");
  });

  it("falls back to sortValue when there is no export value", () => {
    const column: ColumnDef<Row> = {
      key: "name",
      accessor: () => ({ type: "b", props: {} }) as never,
      sortValue: (row) => row.name,
    };
    expect(columnText(column, ROW)).toBe("Ada");
  });

  it("uses accessor when it happens to return a primitive", () => {
    const column: ColumnDef<Row> = {
      key: "name",
      accessor: (row) => row.name,
    };
    expect(columnText(column, ROW)).toBe("Ada");
  });

  it("reads the key's data path for a bare column", () => {
    expect(columnText({ key: "name" }, ROW)).toBe("Ada");
  });

  it("reaches a nested value through a dotted key", () => {
    expect(columnText({ key: "nested.city" }, ROW)).toBe("London");
  });

  it("renders numbers and booleans as themselves", () => {
    expect(columnText({ key: "budget" }, ROW)).toBe("1240");
    expect(columnText({ key: "active" }, ROW)).toBe("true");
  });

  it("renders a date as its ISO day, not a timestamp", () => {
    expect(columnText({ key: "due" }, ROW)).toBe("2026-08-12");
  });

  it("treats an empty string as a real answer, not a miss", () => {
    const column: ColumnDef<Row> = {
      key: "name",
      // "" means the column has nothing to say; falling through to the data
      // path would announce "Ada" over the top of that.
      exportValue: () => "",
    };
    expect(columnText(column, ROW)).toBe("");
  });

  it("says nothing rather than undefined when the column holds nothing", () => {
    expect(columnText({ key: "missing" }, ROW)).toBe("");
  });

  it("says nothing rather than announce a value the cell does not show", () => {
    const column: ColumnDef<Row> = {
      key: "name",
      // The cell renders empty. Reading the data path would announce "Ada" to
      // a screen reader over a cell that visibly holds nothing.
      accessor: () => null,
    };
    expect(columnText(column, ROW)).toBe("");
  });

  it("never returns undefined, whatever the column does", () => {
    const column: ColumnDef<Row> = {
      key: "name",
      accessor: () => null,
      sortValue: () => null,
      exportValue: () => undefined,
    };
    expect(columnText(column, ROW)).toBe("");
  });
});
