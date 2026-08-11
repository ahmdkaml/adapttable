/**
 * Export scopes: which rows and which columns end up in the file.
 *
 * The scopes exist because "export" means different things at different
 * moments — what I can see, everything that matched, or just the rows I
 * ticked — and picking one should never require rebuilding the data by hand.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { TableSource } from "../source/TableSource";
import type { ColumnDef } from "../types";
import { resetDevWarnings } from "../utils/devWarn";
import { buildTableCsv, resolveExportColumns } from "./tableCsv";

interface Row {
  id: string;
  name: string;
  team: string;
  secret: string;
}

const ALL_ROWS: Row[] = [
  { id: "1", name: "Ada", team: "Core", secret: "x" },
  { id: "2", name: "Linus", team: "Web", secret: "y" },
  { id: "3", name: "Grace", team: "Core", secret: "z" },
];

// Accessors are present because `resolveColumns` fills them in from the key
// path before any column reaches an export.
const VISIBLE: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name },
  { key: "team", header: "Team", accessor: (row) => row.team },
];
const ALL_COLUMNS: ColumnDef<Row>[] = [
  ...VISIBLE,
  { key: "secret", header: "Secret", accessor: (row) => row.secret },
];

/** A complete source showing page 2 (one row) of a filtered set of three. */
function source(
  allFilteredRows: readonly Row[] | undefined = ALL_ROWS
): TableSource<Row> {
  const rows = [ALL_ROWS[1]!];
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
    limit: 25,
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

/** A server-backed source: paginated, with no way to rebuild the full set. */
function serverSource(): TableSource<Row> {
  return { ...source(), allFilteredRows: undefined };
}

const getRowId = (row: Row) => row.id;

describe("export row scopes", () => {
  beforeEach(() => {
    resetDevWarnings();
    vi.spyOn(console, "warn").mockImplementation(() => undefined);
  });
  afterEach(() => vi.restoreAllMocks());

  it("exports the page on screen by default", () => {
    const csv = buildTableCsv({ source: source(), columns: VISIBLE });
    expect(csv).toContain("Linus");
    expect(csv).not.toContain("Ada");
  });

  it("exports everything that matched when asked for all", () => {
    const csv = buildTableCsv({
      source: source(),
      columns: VISIBLE,
      scope: "all",
    });
    expect(csv).toContain("Ada");
    expect(csv).toContain("Grace");
  });

  it("exports rows ticked on other pages, not just the visible one", () => {
    const csv = buildTableCsv({
      source: source(),
      columns: VISIBLE,
      scope: "selected",
      context: { selectedIds: new Set(["1", "3"]), getRowId },
    });
    // Ada and Grace are selected but off-screen; Linus is on screen, unticked.
    expect(csv).toContain("Ada");
    expect(csv).toContain("Grace");
    expect(csv).not.toContain("Linus");
  });

  it("keeps table order in a selected export, not selection order", () => {
    const csv = buildTableCsv({
      source: source(),
      columns: VISIBLE,
      scope: "selected",
      context: { selectedIds: new Set(["3", "1"]), getRowId },
    });
    expect(csv.indexOf("Ada")).toBeLessThan(csv.indexOf("Grace"));
  });

  it("writes a header-only file when nothing is ticked", () => {
    const csv = buildTableCsv({
      source: source(),
      columns: VISIBLE,
      scope: "selected",
      context: { selectedIds: new Set<string>(), getRowId },
    });
    expect(csv.trim()).toBe("Name,Team");
  });

  it("falls back to the page, with a warning, when selection is unavailable", () => {
    const csv = buildTableCsv({
      source: source(),
      columns: VISIBLE,
      scope: "selected",
    });
    expect(csv).toContain("Linus");
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain("selected");
  });

  it("falls back to the page, with a warning, when a server source cannot rebuild the set", () => {
    const csv = buildTableCsv({
      source: serverSource(),
      columns: VISIBLE,
      scope: "all",
    });
    expect(csv).toContain("Linus");
    expect(csv).not.toContain("Ada");
    expect(vi.mocked(console.warn).mock.calls[0]?.[0]).toContain('scope "all"');
  });
});

describe("export column scopes", () => {
  it("exports what the user can see by default", () => {
    expect(
      resolveExportColumns(undefined, VISIBLE, ALL_COLUMNS).map((c) => c.key)
    ).toEqual(["name", "team"]);
  });

  it("includes columns hidden through the column menu when asked for all", () => {
    expect(
      resolveExportColumns("all", VISIBLE, ALL_COLUMNS).map((c) => c.key)
    ).toEqual(["name", "team", "secret"]);
  });

  it("takes an explicit list in the order given", () => {
    expect(
      resolveExportColumns(["secret", "name"], VISIBLE, ALL_COLUMNS).map(
        (c) => c.key
      )
    ).toEqual(["secret", "name"]);
  });

  it("ignores a key matching no column, so a stale config cannot break export", () => {
    expect(
      resolveExportColumns(["name", "gone"], VISIBLE, ALL_COLUMNS).map(
        (c) => c.key
      )
    ).toEqual(["name"]);
  });

  it("falls back to the visible set when the full set was never supplied", () => {
    expect(
      resolveExportColumns("all", VISIBLE, undefined).map((c) => c.key)
    ).toEqual(["name", "team"]);
  });
});
