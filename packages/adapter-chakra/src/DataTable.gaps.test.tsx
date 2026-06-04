/** Gap-fill: footer prev, clear-all link, bulk clear. */
import {
  createMemoryAdapter,
  useFrontendData,
  useTableVirtualization,
  type VirtualTableRow,
} from "@adapttable/core";
import { ChakraProvider } from "@chakra-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Row {
  id: string;
  name: string;
}
const ROWS: Row[] = [
  { id: "a", name: "Alice" },
  { id: "b", name: "Bob" },
];
const columns: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
];

vi.mock("@adapttable/core", async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...(actual as object),
    useTableVirtualization: vi.fn(),
  };
});

let adapter: ReturnType<typeof createMemoryAdapter>;

beforeEach(() => {
  vi.mocked(useTableVirtualization).mockImplementation(({ rows, rowKey }) => ({
    enabled: false,
    rows: rows.map((row, index) => ({
      row,
      index,
      key: rowKey(row),
    })),
    paddingTop: 0,
    paddingBottom: 0,
  }));
});

function mount(
  override: Partial<Parameters<typeof DataTable<Row>>[0]> = {},
  url = "",
  mode: "paged" | "infinite" = "paged"
) {
  adapter = createMemoryAdapter(url);
  function Harness() {
    const source = useFrontendData<Row>({
      data: ROWS,
      adapter,
      columns,
      paginationMode: mode,
    });
    return (
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        {...override}
      />
    );
  }
  render(
    <ChakraProvider>
      <Harness />
    </ChakraProvider>
  );
}

describe("Chakra gaps", () => {
  it("footer previous button goes back a page", () => {
    mount({}, "limit=1&page=2");
    fireEvent.click(screen.getByRole("button", { name: "Previous page" }));
    expect(adapter.getSearch()).not.toContain("page=2");
  });

  it("clear-all chip link calls onClearFilters", () => {
    const onClearFilters = vi.fn();
    mount(
      { filterLabels: { status: (v) => `Status: ${v}` }, onClearFilters },
      "f_status=Active"
    );
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("bulk bar Clear button drops the selection", () => {
    mount({ bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }] });
    fireEvent.click(screen.getByLabelText("Select all"));
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear all" }));
    expect(screen.queryByText("2 selected")).toBeNull();
  });

  it("desktop: renders icon row actions and fires them", () => {
    const onClick = vi.fn();
    mount({
      rowActions: [
        {
          key: "view",
          label: "View",
          icon: <span aria-hidden>i</span>,
          onClick,
        },
      ],
    });
    fireEvent.click(screen.getAllByRole("button", { name: "View" })[0]!);
    expect(onClick).toHaveBeenCalledWith(ROWS[0]);
  });

  it("virtualizes desktop rows when enabled", () => {
    vi.mocked(useTableVirtualization).mockReturnValue({
      enabled: true,
      rows: [
        {
          row: { id: "b", name: "Bob" },
          index: 1,
          key: "b",
        } satisfies VirtualTableRow<Row>,
      ],
      paddingTop: 40,
      paddingBottom: 40,
      measureElement: vi.fn(),
    });
    mount({ virtualize: true, estimateRowSize: 40 }, "", "infinite");
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("fetches the next page from the virtual onEndReached", () => {
    let endReached: (() => void) | undefined;
    vi.mocked(useTableVirtualization).mockImplementation(
      ({ rows, rowKey, onEndReached }) => {
        endReached = onEndReached;
        return {
          enabled: true,
          rows: rows.map((row, index) => ({
            row,
            index,
            key: rowKey(row),
          })),
          paddingTop: 0,
          paddingBottom: 0,
          measureElement: vi.fn(),
        };
      }
    );
    mount({ virtualize: true }, "limit=1", "infinite");
    expect(screen.queryByText("Bob")).toBeNull();
    act(() => endReached?.());
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("virtualizes mobile cards when enabled", () => {
    vi.mocked(useTableVirtualization).mockReturnValue({
      enabled: true,
      rows: [
        {
          row: { id: "b", name: "Bob" },
          index: 1,
          key: "b",
        } satisfies VirtualTableRow<Row>,
      ],
      paddingTop: 132,
      paddingBottom: 0,
      measureElement: vi.fn(),
    });
    mount({ isMobile: true, virtualize: true, estimateCardSize: 132 });
    expect(screen.queryByText("Alice")).toBeNull();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
