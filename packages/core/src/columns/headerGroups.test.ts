import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import { headerGroupRow } from "./headerGroups";

interface Row {
  id: string;
}
const col = (key: string, group?: string): ColumnDef<Row> => ({
  key,
  header: key,
  group,
});

describe("headerGroupRow", () => {
  it("returns null when no column declares a group", () => {
    expect(headerGroupRow([col("a"), col("b")])).toBeNull();
  });

  it("merges contiguous same-group columns and gaps", () => {
    expect(
      headerGroupRow([
        col("a", "People"),
        col("b", "People"),
        col("c"),
        col("d"),
        col("e", "Money"),
      ])
    ).toEqual([
      { key: "People-0", label: "People", span: 2 },
      { key: "gap-1", label: null, span: 2 },
      { key: "Money-2", label: "Money", span: 1 },
    ]);
  });

  it("splits a group whose columns were reordered apart", () => {
    const cells = headerGroupRow([col("a", "G"), col("x"), col("b", "G")])!;
    expect(cells.map((c) => c.label)).toEqual(["G", null, "G"]);
  });
});
