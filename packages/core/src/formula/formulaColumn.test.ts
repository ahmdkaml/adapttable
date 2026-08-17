/**
 * Formula columns.
 *
 * The cases worth having are the ones a `map` over the specs would get wrong:
 * a formula that reads another formula, two that read each other, and one
 * that will not parse at all.
 */
import { describe, expect, it } from "vitest";

import { FORMULA_ERRORS } from "./evaluate";
import { buildFormulaColumns } from "./formulaColumn";

interface Row {
  id: string;
  quantity: number;
  unitPrice: number;
  label: string;
}

const ROW: Row = { id: "a", quantity: 3, unitPrice: 10, label: "Widget" };

/** What one column shows for a row. */
const cell = (
  columns: readonly { key: string; accessor?: (row: Row) => unknown }[],
  key: string,
  row: Row = ROW
) => columns.find((column) => column.key === key)?.accessor?.(row);

describe("buildFormulaColumns", () => {
  it("computes a column from the row's fields", () => {
    const { columns, errors, cycles } = buildFormulaColumns<Row>([
      { key: "total", header: "Total", formula: "=quantity * unitPrice" },
    ]);

    expect(cell(columns, "total")).toBe("30");
    expect(errors).toEqual({});
    expect(cycles).toEqual([]);
  });

  it("defaults the header to the key", () => {
    const { columns } = buildFormulaColumns<Row>([
      { key: "total", formula: "=1" },
    ]);

    expect(columns[0]?.header).toBe("total");
  });

  it("lets one formula read another", () => {
    const { columns } = buildFormulaColumns<Row>([
      { key: "total", formula: "=quantity * unitPrice" },
      { key: "withTax", formula: "=total * 2" },
    ]);

    expect(cell(columns, "withTax")).toBe("60");
  });

  it("reports a formula that will not parse, and shows #ERROR! in its cells", () => {
    const { columns, errors } = buildFormulaColumns<Row>([
      { key: "broken", formula: "=1 +" },
    ]);

    expect(errors.broken).toBeTruthy();
    expect(cell(columns, "broken")).toBe(FORMULA_ERRORS.syntax);
  });

  it("finds a cycle instead of recursing until the stack gives out", () => {
    const { columns, cycles } = buildFormulaColumns<Row>([
      { key: "a", formula: "=b + 1" },
      { key: "b", formula: "=a + 1" },
    ]);

    expect([...cycles].sort((x, y) => x.localeCompare(y))).toEqual(["a", "b"]);
    expect(cell(columns, "a")).toBe(FORMULA_ERRORS.cycle);
    expect(cell(columns, "b")).toBe(FORMULA_ERRORS.cycle);
  });

  it("finds a cycle that goes the long way round", () => {
    const { cycles } = buildFormulaColumns<Row>([
      { key: "a", formula: "=b" },
      { key: "b", formula: "=c" },
      { key: "c", formula: "=a" },
    ]);

    expect(cycles).toHaveLength(3);
  });

  it("leaves a column that merely references itself by name alone", () => {
    // `total` reads the row's own `quantity`, not another formula — a
    // declared column is a leaf and cannot be part of a cycle.
    const { cycles } = buildFormulaColumns<Row>([
      { key: "total", formula: "=quantity" },
    ]);

    expect(cycles).toEqual([]);
  });

  it("formats a result, but never an error", () => {
    // Formatting an error as currency would hide which cell went wrong.
    const { columns } = buildFormulaColumns<Row>([
      {
        key: "total",
        formula: "=quantity * unitPrice",
        format: (value) => `$${value.kind === "number" ? value.value : ""}`,
      },
      {
        key: "bad",
        formula: "=missing",
        format: () => "never",
      },
    ]);

    expect(cell(columns, "total")).toBe("$30");
    expect(cell(columns, "bad")).toBe(FORMULA_ERRORS.name);
  });

  it("sorts by the number, not by the formatting", () => {
    const { columns } = buildFormulaColumns<Row>([
      {
        key: "total",
        formula: "=quantity * unitPrice",
        format: () => "thirty",
      },
    ]);

    expect(columns[0]?.sortValue?.(ROW)).toBe(30);
  });

  it("exports the value a spreadsheet can use", () => {
    const { columns } = buildFormulaColumns<Row>([
      { key: "total", formula: "=quantity * unitPrice" },
    ]);

    expect(columns[0]?.exportValue?.(ROW)).toBe("30");
  });

  it("recomputes when a field it reads changes, and not otherwise", () => {
    const { columns } = buildFormulaColumns<Row>([
      { key: "total", formula: "=quantity * unitPrice" },
    ]);

    expect(cell(columns, "total")).toBe("30");
    // A different row object with a different quantity.
    expect(cell(columns, "total", { ...ROW, quantity: 5 })).toBe("50");
    // The same row object again reads its memo rather than re-evaluating.
    expect(cell(columns, "total")).toBe("30");
  });

  it("keeps the order the specs were given in", () => {
    const { columns } = buildFormulaColumns<Row>([
      { key: "b", formula: "=1" },
      { key: "a", formula: "=2" },
    ]);

    expect(columns.map((column) => column.key)).toEqual(["b", "a"]);
  });
});
