/**
 * Handing an export to the backend.
 *
 * Past a certain size the browser is the wrong place to build the file, so the
 * button sends the user's current view somewhere that can. Two things must
 * hold: the table builds and downloads nothing itself, and the same export
 * cannot be started twice by an impatient second click.
 */
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { TableSource } from "../source/TableSource";
import type { ColumnDef } from "../types";
import { resetDevWarnings } from "../utils/devWarn";
import { type ExportRequest, makeExportCsvHandler } from "./tableCsv";
import { useExportHandler } from "./useExportHandler";

interface Row {
  id: string;
  name: string;
}

const ROWS: Row[] = [{ id: "1", name: "Ada" }];
const COLUMNS: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (row) => row.name },
];

function source(): TableSource<Row> {
  return {
    rows: ROWS,
    allFilteredRows: ROWS,
    total: 1,
    isLoading: false,
    isFetching: false,
    isFetchingNextPage: false,
    hasNextPage: false,
    fetchNextPage: () => undefined,
    error: null,
    paginationMode: "paged",
    page: 3,
    limit: 25,
    search: "ada",
    sortBy: "name",
    sortDir: "desc",
    groupBy: undefined,
    extra: { team: "Core" },
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

describe("exportCsv.request", () => {
  it("sends the current view instead of building a file", () => {
    let seen: ExportRequest<Row> | undefined;
    const handler = makeExportCsvHandler<Row>(
      {
        request: (info) => {
          seen = info;
        },
      },
      source(),
      COLUMNS
    );
    handler?.();

    expect(seen?.query).toEqual({
      page: 3,
      limit: 25,
      search: "ada",
      sortBy: "name",
      sortDir: "desc",
      filters: { team: "Core" },
      groupBy: undefined,
    });
    expect(seen?.scope).toBe("page");
    expect(seen?.columns.map((column) => column.key)).toEqual(["name"]);
    expect(seen?.filename).toBe("export.csv");
  });

  it("passes the chosen scopes through to the request", () => {
    let seen: ExportRequest<Row> | undefined;
    makeExportCsvHandler<Row>(
      {
        scope: "all",
        columns: ["name"],
        filename: "people.csv",
        request: (info) => {
          seen = info;
        },
      },
      source(),
      COLUMNS
    )?.();

    expect(seen?.scope).toBe("all");
    expect(seen?.filename).toBe("people.csv");
  });

  it("never runs the browser export hooks when the host takes over", () => {
    const onBeforeExport = vi.fn();
    const onAfterExport = vi.fn();
    makeExportCsvHandler<Row>(
      {
        request: () => undefined,
        onBeforeExport,
        onAfterExport,
      },
      source(),
      COLUMNS
    )?.();

    // No file was built, so nothing brackets the building of one.
    expect(onBeforeExport).not.toHaveBeenCalled();
    expect(onAfterExport).not.toHaveBeenCalled();
  });
});

describe("useExportHandler", () => {
  /** A button wired exactly the way every adapter wires it. */
  function Harness({ request }: { request: () => void | Promise<void> }) {
    const { onExportCsv, exportBusy } = useExportHandler(
      makeExportCsvHandler<Row>({ request }, source(), COLUMNS)
    );
    return (
      <button
        type="button"
        onClick={onExportCsv}
        disabled={exportBusy}
        aria-busy={exportBusy}
      >
        Export
      </button>
    );
  }

  it("marks the button busy while the host is working, then releases it", async () => {
    let settle!: () => void;
    const request = () =>
      new Promise<void>((resolve) => {
        settle = resolve;
      });
    render(<Harness request={request} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");

    await act(async () => {
      settle();
      await Promise.resolve();
    });
    expect(button).not.toBeDisabled();
  });

  it("refuses a second click while the first export is still running", () => {
    const request = vi.fn(() => new Promise<void>(() => undefined));
    render(<Harness request={request} />);
    const button = screen.getByRole("button");

    fireEvent.click(button);
    fireEvent.click(button);

    expect(request).toHaveBeenCalledTimes(1);
  });

  it("releases the button when the export fails", async () => {
    resetDevWarnings();
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);
    const request = () => Promise.reject(new Error("backend said no"));
    render(<Harness request={request} />);
    const button = screen.getByRole("button");

    await act(async () => {
      button.click();
      await Promise.resolve();
    });

    // A rejected export must not disable the button for the rest of the
    // session — the user has to be able to try again.
    expect(button).not.toBeDisabled();
    // …and the failure is reported rather than swallowed or left to float as
    // an unhandled rejection in the host's error reporting.
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("exportCsv.request rejected")
    );
  });

  it("stays synchronous, and never busy, for the built-in export", () => {
    function Plain() {
      const { exportBusy, onExportCsv } = useExportHandler(
        makeExportCsvHandler<Row>(true, source(), COLUMNS)
      );
      return (
        <button type="button" onClick={onExportCsv} aria-busy={exportBusy}>
          Export
        </button>
      );
    }
    render(<Plain />);
    const button = screen.getByRole("button");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-busy", "false");
  });
});
