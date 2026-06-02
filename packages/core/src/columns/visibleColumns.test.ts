import { describe, expect, it } from "vitest";

import type { ColumnDef } from "../types";
import { visibleColumns } from "./visibleColumns";

interface Row {
  id: string;
}
const cols: ColumnDef<Row>[] = [
  { key: "a", header: "A" },
  { key: "b", header: "B", hideOnMobile: true },
  { key: "c", header: "C" },
  { key: "d", header: "D", hideOnMobile: true },
  { key: "e", header: "E", hideOnDesktop: true },
];

describe("visibleColumns", () => {
  it("drops hideOnDesktop columns on desktop", () => {
    expect(visibleColumns(cols, "desktop").map((c) => c.key)).toEqual([
      "a",
      "b",
      "c",
      "d",
    ]);
  });

  it("keeps the first three desktop columns on mobile even if hideOnMobile", () => {
    // a, b, c are the first three desktop-visible → all surface; d is
    // hideOnMobile and beyond the first three → dropped.
    expect(visibleColumns(cols, "mobile").map((c) => c.key)).toEqual([
      "a",
      "b",
      "c",
    ]);
  });

  it("lets callers customize how many identity columns mobile keeps", () => {
    expect(visibleColumns(cols, "mobile", 1).map((c) => c.key)).toEqual([
      "a",
      "c",
    ]);
  });
});
