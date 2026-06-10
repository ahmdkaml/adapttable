import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { useFrontendData } from "./source/useFrontendData";
import { tableRenderModel } from "./tableRenderProps";
import type { ColumnDef } from "./types";
import { createMemoryAdapter } from "./url/adapter";
import type { UseDataTableResult } from "./useDataTable/useDataTable";
import { useChromeScrollReset, useTableChrome } from "./useTableChrome";

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];
const cols: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name },
];

describe("tableRenderModel", () => {
  const table = {
    columns: cols,
    selection: null,
    labels: { cancel: "Cancel" },
  } as unknown as UseDataTableResult<Row>;

  it("derives the shared renderer prelude", () => {
    const model = tableRenderModel({
      table,
      rows: ROWS,
      rowActions: [{ key: "e", label: "Edit", onClick: () => undefined }],
      getRowId: (r) => r.id,
      rowEntries: undefined,
    });
    expect(model.showActions).toBe(true);
    expect(model.entries.map((e) => e.key)).toEqual(["a", "b"]);
    // 1 data column + 1 actions column, no selection.
    expect(model.columnSpan).toBe(2);
  });

  it("counts the selection column and omits absent actions", () => {
    const withSelection = {
      ...table,
      selection: { selectedIds: new Set() },
    } as unknown as UseDataTableResult<Row>;
    const model = tableRenderModel({
      table: withSelection,
      rows: ROWS,
      rowActions: undefined,
      getRowId: (r) => r.id,
      rowEntries: undefined,
    });
    expect(model.showActions).toBe(false);
    expect(model.columnSpan).toBe(2); // selection + 1 data column
  });
});

describe("useChromeScrollReset", () => {
  it("wires the shared scroll-restoration without crashing", () => {
    const adapter = createMemoryAdapter("");
    const ref = { current: document.createElement("div") };
    const { result } = renderHook(() => {
      const source = useFrontendData<Row>({
        data: ROWS,
        columns: cols,
        adapter,
        paginationMode: "paged",
      });
      const props = { source, columns: cols, rowKey: (r: Row) => r.id };
      const chrome = useTableChrome<Row>(props);
      useChromeScrollReset(ref, chrome, props);
      return chrome;
    });
    expect(result.current.table.rows).toHaveLength(2);
  });
});
