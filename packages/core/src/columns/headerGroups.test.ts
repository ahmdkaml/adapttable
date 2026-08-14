import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import {
  applyCollapsedColumnGroups,
  columnGroupId,
  columnGroupPath,
  headerGroupRow,
  headerGroupRows,
  toggleCollapsedColumnGroup,
} from "./headerGroups";

interface Row {
  id: string;
}
const col = (
  key: string,
  group?: string | readonly string[]
): ColumnDef<Row> => ({
  key,
  header: key,
  group,
});

describe("columnGroupPath", () => {
  it("is empty until a group is declared", () => {
    expect(columnGroupPath(col("a"))).toEqual([]);
  });

  it("wraps a string as one level", () => {
    expect(columnGroupPath(col("a", "People"))).toEqual(["People"]);
  });

  it("keeps a path as-is", () => {
    expect(columnGroupPath(col("a", ["Finance", "Q1"]))).toEqual([
      "Finance",
      "Q1",
    ]);
  });
});

describe("headerGroupRow", () => {
  it("returns null when no column declares a group", () => {
    expect(headerGroupRow([col("a"), col("b")])).toBeNull();
  });

  it("merges contiguous same-group columns and gaps", () => {
    const cells = headerGroupRow([
      col("a", "People"),
      col("b", "People"),
      col("c"),
      col("d"),
      col("e", "Money"),
    ])!;
    expect(cells.map((c) => [c.label, c.span])).toEqual([
      ["People", 2],
      [null, 2],
      ["Money", 1],
    ]);
  });

  it("splits a group whose columns were reordered apart", () => {
    const cells = headerGroupRow([col("a", "G"), col("x"), col("b", "G")])!;
    expect(cells.map((c) => c.label)).toEqual(["G", null, "G"]);
  });
});

describe("headerGroupRows", () => {
  it("stacks a path into one row per depth", () => {
    const rows = headerGroupRows([
      col("a", ["Finance", "Q1"]),
      col("b", ["Finance", "Q1"]),
      col("c", ["Finance", "Q2"]),
    ])!;
    expect(rows).toHaveLength(2);
    expect(rows[0]!.map((c) => [c.label, c.span])).toEqual([["Finance", 3]]);
    expect(rows[1]!.map((c) => [c.label, c.span])).toEqual([
      ["Q1", 2],
      ["Q2", 1],
    ]);
  });

  it("marks a collapsed group when asked", () => {
    const id = columnGroupId(["People"]);
    const rows = headerGroupRows(
      [col("a", "People"), col("b", "People")],
      [id],
      true
    )!;
    expect(rows[0]![0]).toMatchObject({
      id,
      collapsed: true,
      collapsible: true,
    });
  });
});

describe("applyCollapsedColumnGroups", () => {
  it("keeps the first leaf of a collapsed group as the summary", () => {
    const columns = [col("a", "People"), col("b", "People"), col("c", "Money")];
    const next = applyCollapsedColumnGroups(columns, [
      columnGroupId(["People"]),
    ]);
    expect(next.map((c) => c.key)).toEqual(["a", "c"]);
  });

  it("collapses a nested path to the first leaf under that id", () => {
    const columns = [
      col("a", ["Finance", "Q1"]),
      col("b", ["Finance", "Q1"]),
      col("c", ["Finance", "Q2"]),
    ];
    const next = applyCollapsedColumnGroups(columns, [
      columnGroupId(["Finance"]),
    ]);
    expect(next.map((c) => c.key)).toEqual(["a"]);
  });

  it("does not hide a column reordered out of the group", () => {
    const columns = [col("a", "G"), col("x"), col("b", "G")];
    const next = applyCollapsedColumnGroups(columns, [columnGroupId(["G"])]);
    expect(next.map((c) => c.key)).toEqual(["a", "x", "b"]);
  });
});

describe("toggleCollapsedColumnGroup", () => {
  it("adds then removes the id", () => {
    const id = columnGroupId(["People"]);
    expect(toggleCollapsedColumnGroup([], id)).toEqual([id]);
    expect(toggleCollapsedColumnGroup([id], id)).toEqual([]);
  });
});
