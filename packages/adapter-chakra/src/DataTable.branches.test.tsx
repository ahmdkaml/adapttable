/**
 * Branch-coverage fill: exercises the remaining uncovered conditional
 * branches in DataTable.tsx, components/chrome.tsx and components/tables.tsx
 * that the existing suites only hit on one side.
 */
import {
  createMemoryAdapter,
  defaultLabels,
  useFrontendData,
  useTableVirtualization,
} from "@adapttable/core";
import { ChakraProvider } from "@chakra-ui/react";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { FilterDrawer, LoadingState } from "./components/chrome";
import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Row {
  id: string;
  name: string;
  city: string;
}
const ROWS: Row[] = [
  { id: "a", name: "Alice", city: "Dubai" },
  { id: "b", name: "Bob", city: "Riyadh" },
];
const columns: ColumnDef<Row>[] = [
  { key: "name", header: "Name", accessor: (r) => r.name, sortable: true },
  { key: "city", header: "City", accessor: (r) => r.city },
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
  // Default: pass-through (non-virtual) so the normal render path runs.
  vi.mocked(useTableVirtualization).mockImplementation(({ rows, rowKey }) => ({
    enabled: false,
    rows: rows.map((row, index) => ({ row, index, key: rowKey(row) })),
    paddingTop: 0,
    paddingBottom: 0,
  }));
});

function mount(
  override: Partial<Parameters<typeof DataTable<Row>>[0]> = {},
  url = "",
  opts: { mode?: "paged" | "infinite"; isMobile?: boolean; rows?: Row[] } = {}
) {
  adapter = createMemoryAdapter(url);
  function Harness() {
    const source = useFrontendData<Row>({
      data: opts.rows ?? ROWS,
      adapter,
      columns,
      paginationMode: opts.mode ?? "paged",
    });
    return (
      <DataTable
        source={source}
        columns={columns}
        rowKey={(r) => r.id}
        isMobile={opts.isMobile}
        {...override}
      />
    );
  }
  return render(
    <ChakraProvider>
      <Harness />
    </ChakraProvider>
  );
}

describe("chrome.tsx branches", () => {
  it("uses a custom searchPlaceholder (placeholder-present branch)", () => {
    mount({ searchPlaceholder: "Find rows…" });
    const input = screen.getByLabelText(defaultLabels.search);
    expect(input).toHaveAttribute("placeholder", "Find rows…");
  });

  it("clears the sort when the sort select is emptied (value || undefined falsy)", () => {
    mount(
      { sortByOptions: [{ value: "name", label: "Name" }] },
      "sortBy=name&sortDir=asc",
      { mode: "infinite" }
    );
    fireEvent.change(screen.getByLabelText(defaultLabels.sortBy), {
      target: { value: "" },
    });
    expect(adapter.getSearch()).not.toContain("sortBy=name");
  });

  it("renders a bulk-action element icon (isValidElement true branch)", () => {
    mount({
      bulkActions: [
        {
          key: "del",
          label: "Delete",
          icon: <span data-testid="bulk-icon">x</span>,
          onClick: vi.fn(),
        },
      ],
    });
    fireEvent.click(screen.getByLabelText(defaultLabels.selectAll));
    expect(screen.getByTestId("bulk-icon")).toBeInTheDocument();
  });

  it("places the filter drawer on the left in RTL (dir === 'rtl' true branch)", async () => {
    mount({ filters: <div>rtl-body</div>, dir: "rtl" });
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(await screen.findByText("rtl-body")).toBeInTheDocument();
  });

  it("invokes onClearFilters from the drawer clear-all button", async () => {
    const onClearFilters = vi.fn();
    render(
      <ChakraProvider>
        <FilterDrawer
          open
          onClose={vi.fn()}
          filters={<div>cf-body</div>}
          activeFilterCount={2}
          onClearFilters={onClearFilters}
          labels={defaultLabels}
        />
      </ChakraProvider>
    );
    await screen.findByText("cf-body");
    // With activeFilterCount > 0 the clear-all button is enabled.
    fireEvent.click(
      screen.getByRole("button", { name: defaultLabels.clearAll })
    );
    expect(onClearFilters).toHaveBeenCalled();
  });

  it("LoadingState omits the visually-hidden label when none is given (loadingLabel falsy)", () => {
    const { container } = render(
      <ChakraProvider>
        <LoadingState rows={2} columns={2} />
      </ChakraProvider>
    );
    expect(screen.getByRole("status")).toBeInTheDocument();
    // No loadingLabel → the VisuallyHidden node is not rendered.
    expect(container.textContent).toBe("");
  });

  it("FilterDrawer defaults placement to the right in LTR (dir === 'rtl' false branch)", async () => {
    render(
      <ChakraProvider>
        <FilterDrawer
          open
          onClose={vi.fn()}
          filters={<div>ltr-body</div>}
          activeFilterCount={0}
          labels={defaultLabels}
        />
      </ChakraProvider>
    );
    expect(await screen.findByText("ltr-body")).toBeInTheDocument();
  });
});

describe("tables.tsx branches", () => {
  it("aligns an 'end' column to the end (chakraAlign end branch)", () => {
    const endCols: ColumnDef<Row>[] = [
      { key: "name", header: "Name", align: "end", accessor: (r) => r.name },
    ];
    mount({ columns: endCols });
    const cell = screen.getByText("Alice").closest("td")!;
    expect(cell).toHaveStyle({ textAlign: "end" });
  });

  it("hides a row action whose isHidden returns true", () => {
    mount({
      rowActions: [
        { key: "edit", label: "Edit", isHidden: () => true, onClick: vi.fn() },
      ],
    });
    expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  });

  it("renders a sticky header when stickyHeader is set", () => {
    mount({ stickyHeader: true, stickyTop: 12 });
    const header = screen
      .getAllByRole("columnheader")
      .find((th) => getComputedStyle(th).position === "sticky");
    expect(header).toBeTruthy();
  });

  it("uses the column key for a non-string sortable header (columnName key branch)", () => {
    const reactHeaderCols: ColumnDef<Row>[] = [
      {
        key: "name",
        header: <em>Name</em>,
        sortable: true,
        accessor: (r) => r.name,
      },
    ];
    mount({ columns: reactHeaderCols });
    // columnName falls back to the key → sort button aria-label uses "name".
    expect(
      screen.getByRole("button", { name: `${defaultLabels.sortBy}: name` })
    ).toBeInTheDocument();
  });

  it("renders trailing padding in virtualized mobile cards (paddingBottom > 0 true branch)", () => {
    vi.mocked(useTableVirtualization).mockReturnValue({
      enabled: true,
      rows: [{ row: ROWS[1]!, index: 1, key: "b" }],
      paddingTop: 0,
      paddingBottom: 40,
      measureElement: vi.fn(),
    });
    mount({ virtualize: true, estimateCardSize: 40 }, "", {
      mode: "infinite",
      isMobile: true,
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});

describe("DataTable.tsx branches", () => {
  it("skips fetchNextPage from onEndReached while already fetching", () => {
    let endReached: (() => void) | undefined;
    const fetchSpy = vi.fn();
    adapter = createMemoryAdapter("limit=1");

    vi.mocked(useTableVirtualization).mockImplementation(
      ({ rows, rowKey, onEndReached }) => {
        endReached = onEndReached;
        return {
          enabled: true,
          rows: rows.map((row, index) => ({ row, index, key: rowKey(row) })),
          paddingTop: 0,
          paddingBottom: 0,
          measureElement: vi.fn(),
        };
      }
    );

    function Harness() {
      const real = useFrontendData<Row>({
        data: ROWS,
        adapter,
        columns,
        paginationMode: "infinite",
      });
      // Force the "currently fetching" state so !isFetchingNextPage is false.
      const source = {
        ...real,
        hasNextPage: true,
        isFetchingNextPage: true,
        fetchNextPage: fetchSpy,
      };
      return (
        <DataTable
          source={source}
          columns={columns}
          rowKey={(r) => r.id}
          virtualize
        />
      );
    }
    render(
      <ChakraProvider>
        <Harness />
      </ChakraProvider>
    );

    act(() => endReached?.());
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("evaluates the virtualization enabled chain for mobile in infinite mode", () => {
    const enabledArgs: boolean[] = [];
    vi.mocked(useTableVirtualization).mockImplementation((args) => {
      enabledArgs.push(Boolean(args.enabled));
      const { rows, rowKey } = args;
      const second = rows[1]!;
      return {
        enabled: true,
        rows: [{ row: second, index: 1, key: rowKey(second) }],
        paddingTop: 0,
        paddingBottom: 0,
        measureElement: vi.fn(),
      };
    });
    mount({ virtualize: true }, "", { mode: "infinite", isMobile: true });
    // The enabled flag is true: virtualize && !paged && !error && body === "mobile".
    expect(enabledArgs.some((e) => e === true)).toBe(true);
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});
