import { fireEvent } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";
import { renderBaseUi } from "./test-utils";

interface Row {
  id: string;
  name: string;
  team: string;
}
const ROWS: Row[] = [
  { id: "1", name: "A", team: "X" },
  { id: "2", name: "B", team: "Y" },
];
/** One sortable column and one not: the gesture differs between them. */
const COLS: ColumnDef<Row>[] = [
  { key: "name", header: "N", accessor: (r) => r.name },
  { key: "team", header: "T", accessor: (r) => r.team, sortable: true },
];

/**
 * Column selection from the header (base-ui).
 *
 * A sortable header's plain click already sorts, so the rule is: Ctrl/Cmd+click
 * selects anywhere, a plain click selects only where nothing else claims it.
 */
describe("column selection from the header (base-ui)", () => {
  const headers = (c: HTMLElement) =>
    c.querySelectorAll<HTMLElement>("thead th");

  it("selects a whole non-sorting column on a plain click", () => {
    const { container } = renderBaseUi(
      <DataTable
        data={ROWS}
        columns={COLS}
        rowKey={(r) => r.id}
        urlSync={false}
        cellNavigation
      />
    );
    fireEvent.click(headers(container)[0]!);
    // Both loaded rows of that column, and nothing from the other.
    expect(container.querySelectorAll("[data-cell-selected]")).toHaveLength(2);
  });

  it("leaves a sortable header's plain click to sorting", () => {
    const { container } = renderBaseUi(
      <DataTable
        data={ROWS}
        columns={COLS}
        rowKey={(r) => r.id}
        urlSync={false}
        cellNavigation
      />
    );
    fireEvent.click(headers(container)[1]!);
    expect(container.querySelectorAll("[data-cell-selected]")).toHaveLength(0);
  });

  it("selects a sortable column on Ctrl+click", () => {
    const { container } = renderBaseUi(
      <DataTable
        data={ROWS}
        columns={COLS}
        rowKey={(r) => r.id}
        urlSync={false}
        cellNavigation
      />
    );
    fireEvent.click(headers(container)[1]!, { ctrlKey: true });
    expect(container.querySelectorAll("[data-cell-selected]")).toHaveLength(2);
  });
});
