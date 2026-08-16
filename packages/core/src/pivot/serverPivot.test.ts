/**
 * Server-side pivoting.
 *
 * The property that matters is that a server's answer and a local
 * calculation produce the SAME result shape — otherwise every adapter needs
 * two rendering paths and the two drift.
 */
import { describe, expect, it } from "vitest";

import { pivot, PIVOT_GRAND_TOTAL_KEY, type PivotConfig } from "./pivotModel";
import { type QueryPivotPage, serverPivotResult } from "./serverPivot";

const config: PivotConfig = {
  rows: ["team"],
  columns: ["quarter"],
  measures: [{ key: "amount", agg: "sum" }],
};

const page: QueryPivotPage = {
  columns: [["Q1"], ["Q2"]],
  rows: [
    { path: ["Alpha"], cells: [10, 20], count: 2 },
    { path: ["Beta"], cells: [30, 40], count: 2 },
  ],
  total: { path: [], cells: [40, 60], count: 4 },
};

describe("serverPivotResult", () => {
  it("renders the server's numbers in the server's order", () => {
    const result = serverPivotResult(page, { config });

    expect(result.rows.map((row) => row.label)).toEqual(["Alpha", "Beta", ""]);
    expect(result.rows[0]?.cells).toEqual([10, 20]);
  });

  it("marks the total line as the grand total", () => {
    const result = serverPivotResult(page, { config });
    const grand = result.rows.find((row) => row.key === PIVOT_GRAND_TOTAL_KEY);

    expect(grand?.kind).toBe("grandTotal");
    expect(grand?.cells).toEqual([40, 60]);
  });

  it("produces the same shape the local engine does", () => {
    // Not the same numbers — the same SHAPE. An adapter renders one thing.
    const local = pivot(
      [
        { team: "Alpha", quarter: "Q1", amount: 10 },
        { team: "Alpha", quarter: "Q2", amount: 20 },
      ],
      { ...config, grandTotals: false }
    );
    const remote = serverPivotResult(
      {
        columns: [["Q1"], ["Q2"]],
        rows: [{ path: ["Alpha"], cells: [10, 20] }],
      },
      { config }
    );

    const byName = (a: string, b: string) => a.localeCompare(b);
    expect(Object.keys(remote).sort(byName)).toEqual(
      Object.keys(local).sort(byName)
    );
    expect(remote.rowDepth).toBe(local.rowDepth);
    expect(remote.columnLeaves.map((leaf) => leaf.path)).toEqual(
      local.columnLeaves.filter((leaf) => !leaf.total).map((leaf) => leaf.path)
    );
  });

  it("rebuilds the column header tree with its spans", () => {
    const result = serverPivotResult(
      {
        columns: [
          ["EU", "Q1"],
          ["EU", "Q2"],
          ["US", "Q1"],
        ],
        rows: [{ path: ["Alpha"], cells: [1, 2, 3] }],
      },
      { config: { ...config, columns: ["region", "quarter"] } }
    );

    expect(result.columnTree.map((node) => [node.label, node.span])).toEqual([
      ["EU", 2],
      ["US", 1],
    ]);
  });

  it("multiplies the server's column paths by the measures", () => {
    const result = serverPivotResult(
      {
        columns: [["Q1"]],
        rows: [{ path: ["Alpha"], cells: [10, 1] }],
      },
      {
        config: {
          ...config,
          measures: [
            { key: "amount", agg: "sum" },
            { key: "amount", agg: "count" },
          ],
        },
      }
    );

    expect(result.columnLeaves).toHaveLength(2);
    expect(result.rows[0]?.cells).toEqual([10, 1]);
  });

  it("treats a cell the server omitted as empty, not zero", () => {
    const result = serverPivotResult(
      { columns: [["Q1"], ["Q2"]], rows: [{ path: ["Alpha"], cells: [10] }] },
      { config }
    );

    expect(result.rows[0]?.cells).toEqual([10, undefined]);
  });

  it("honours a subtotal line the server marked", () => {
    const result = serverPivotResult(
      {
        columns: [["Q1"]],
        rows: [
          { path: ["EU"], cells: [30], subtotal: true },
          { path: ["EU", "Alpha"], cells: [30] },
        ],
      },
      { config: { ...config, rows: ["region", "team"] } }
    );

    expect(result.rows.map((row) => row.kind)).toEqual(["subtotal", "leaf"]);
    expect(result.rows[1]?.depth).toBe(1);
  });

  it("formats cells when asked", () => {
    const result = serverPivotResult(page, {
      config,
      format: (value) => `$${typeof value === "number" ? value : ""}`,
    });

    expect(result.rows[0]?.cells).toEqual(["$10", "$20"]);
  });

  it("renders a server answer with no total at all", () => {
    const result = serverPivotResult(
      { columns: [["Q1"]], rows: [{ path: ["Alpha"], cells: [1] }] },
      { config }
    );

    expect(result.rows.every((row) => row.kind !== "grandTotal")).toBe(true);
  });
});
