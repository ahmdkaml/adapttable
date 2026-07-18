import { describe, expect, it } from "vitest";

import type { TableSource } from "../source/TableSource";
import type { ColumnDef } from "../types";
import {
  buildTableCsv,
  exportableColumns,
  makeExportCsvHandler,
  resolveExportCsv,
} from "./tableCsv";

interface Person {
  id: string;
  name: string;
  age: number;
}

const COLS: ColumnDef<Person>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name },
  { key: "age", header: "Age", accessor: (r) => r.age },
  { key: "actions", header: "Actions" },
];

const PAGE: Person[] = [
  { id: "1", name: "Ada", age: 36 },
  { id: "2", name: "Grace", age: 85 },
];

const ALL: Person[] = [...PAGE, { id: "3", name: "Alan", age: 41 }];

function source(
  rows: readonly Person[],
  allFilteredRows?: readonly Person[]
): TableSource<Person> {
  return {
    rows,
    allFilteredRows,
    total: allFilteredRows?.length ?? rows.length,
    isLoading: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: () => undefined,
    error: null,
    paginationMode: "paged",
    page: 1,
    limit: 2,
    search: "",
    sortBy: undefined,
    sortDir: undefined,
    groupBy: undefined,
    extra: {},
    setPage: () => undefined,
    setLimit: () => undefined,
    setSort: () => undefined,
    setGroupBy: () => undefined,
    sortLevels: [],
    toggleSortLevel: () => undefined,
    setSearch: () => undefined,
    setExtra: () => undefined,
    setExtras: () => undefined,
    clearExtras: () => undefined,
    clearAll: () => undefined,
  };
}

describe("resolveExportCsv", () => {
  it("turns off for falsy", () => {
    expect(resolveExportCsv(undefined)).toBeNull();
    expect(resolveExportCsv(false)).toBeNull();
  });

  it("accepts true and option objects", () => {
    expect(resolveExportCsv(true)).toEqual({});
    expect(resolveExportCsv({ filename: "x.csv", scope: "all" })).toEqual({
      filename: "x.csv",
      scope: "all",
    });
  });
});

describe("exportableColumns", () => {
  it("drops the actions column", () => {
    expect(exportableColumns(COLS).map((c) => c.key)).toEqual(["name", "age"]);
  });
});

describe("buildTableCsv", () => {
  it("exports the current page by default", () => {
    const csv = buildTableCsv({
      source: source(PAGE, ALL),
      columns: COLS,
    });
    expect(csv).toBe("Name,Age\r\nAda,36\r\nGrace,85");
  });

  it("exports allFilteredRows when scope is all", () => {
    const csv = buildTableCsv({
      source: source(PAGE, ALL),
      columns: COLS,
      scope: "all",
    });
    expect(csv.split("\r\n")).toEqual([
      "Name,Age",
      "Ada,36",
      "Grace,85",
      "Alan,41",
    ]);
  });

  it("falls back to page rows when allFilteredRows is missing", () => {
    const csv = buildTableCsv({
      source: source(PAGE),
      columns: COLS,
      scope: "all",
    });
    expect(csv).toBe("Name,Age\r\nAda,36\r\nGrace,85");
  });
});

describe("makeExportCsvHandler", () => {
  it("returns undefined when export is off", () => {
    expect(makeExportCsvHandler(undefined, source(PAGE), COLS)).toBeUndefined();
    expect(makeExportCsvHandler(false, source(PAGE), COLS)).toBeUndefined();
  });

  it("returns a callable handler when export is on", () => {
    expect(typeof makeExportCsvHandler(true, source(PAGE), COLS)).toBe(
      "function"
    );
  });
});
