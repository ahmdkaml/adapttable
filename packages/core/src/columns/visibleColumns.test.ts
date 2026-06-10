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
    // hideOnMobile and beyond the first three → dropped; e is mobile-only
    // (hideOnDesktop) → it renders here.
    expect(visibleColumns(cols, "mobile").map((c) => c.key)).toEqual([
      "a",
      "b",
      "c",
      "e",
    ]);
  });

  it("lets callers customize how many identity columns mobile keeps", () => {
    expect(visibleColumns(cols, "mobile", 1).map((c) => c.key)).toEqual([
      "a",
      "c",
      "e",
    ]);
  });

  it("renders a mobile-only column (hideOnDesktop) on mobile but not desktop", () => {
    const mobileOnly: ColumnDef<Row>[] = [
      { key: "name", header: "Name" },
      { key: "summary", header: "Summary", hideOnDesktop: true },
    ];
    expect(visibleColumns(mobileOnly, "desktop").map((c) => c.key)).toEqual([
      "name",
    ]);
    expect(visibleColumns(mobileOnly, "mobile").map((c) => c.key)).toEqual([
      "name",
      "summary",
    ]);
  });
});
