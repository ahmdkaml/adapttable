import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import { columnMenuLabel, columnMenuRows } from "./columnMenuModel";
import type { UseColumnLayoutResult } from "./useColumnLayout";

interface Row {
  id: string;
}
const cols: ColumnDef<Row>[] = [
  { key: "a", header: "Alpha", accessor: (r) => r.id },
  { key: "b", header: "Bravo", accessor: (r) => r.id },
  { key: "c", header: 123, mobileLabel: "Charlie" },
  { key: "d", header: 456 },
];

function layout(
  hidden: string[],
  pinned: Record<string, "left" | "right"> = {}
): UseColumnLayoutResult<Row> {
  const visible = cols.filter((c) => !hidden.includes(c.key));
  return {
    state: { hidden, order: [], pinned, widths: {} },
    visibleColumns: visible,
    isHidden: (k) => hidden.includes(k),
    setHidden: () => undefined,
    toggleVisible: () => undefined,
    setPinned: () => undefined,
    move: () => undefined,
    setWidth: () => undefined,
    pinOffset: () => undefined,
    reset: () => undefined,
  };
}

describe("columnMenuLabel", () => {
  it("uses the header string, then mobileLabel, then key", () => {
    expect(columnMenuLabel(cols[0]!)).toBe("Alpha");
    expect(columnMenuLabel(cols[2]!)).toBe("Charlie");
    expect(columnMenuLabel(cols[3]!)).toBe("d");
  });
});

describe("columnMenuRows", () => {
  it("keeps every column in declared order — hiding does not reorder", () => {
    const rows = columnMenuRows(cols, layout(["b"], { a: "left" }));
    expect(rows.map((r) => r.key)).toEqual(["a", "b", "c", "d"]);
    expect(rows[0]!.pinnedLeft).toBe(true);
    expect(rows[0]!.index).toBe(0);
    // Bravo is hidden but stays in position 1 with a stable reorder index.
    const bravo = rows[1]!;
    expect(bravo.key).toBe("b");
    expect(bravo.hidden).toBe(true);
    expect(bravo.index).toBe(1);
  });

  it("honors an explicit column order including hidden columns", () => {
    const l = layout(["a"]);
    l.state = { ...l.state, order: ["c", "a", "b", "d"] };
    const rows = columnMenuRows(cols, l);
    expect(rows.map((r) => r.key)).toEqual(["c", "a", "b", "d"]);
    expect(rows[1]!.key).toBe("a");
    expect(rows[1]!.hidden).toBe(true);
  });
});
