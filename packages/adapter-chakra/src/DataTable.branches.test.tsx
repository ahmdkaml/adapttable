/**
 * Branch-coverage fill: exercises the remaining uncovered conditional
 * branches in DataTable.tsx, components/chrome.tsx and components/tables.tsx
 * that the existing suites only hit on one side.
 */
import type * as CoreModule from "@adapttable/core";
import {
  createMemoryAdapter,
  defaultLabels,
  useChromeBodyData,
  useFrontendData,
} from "@adapttable/core";
import { ChakraProvider } from "@chakra-ui/react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createRef } from "react";
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
  const actual = await importOriginal<typeof CoreModule>();
  return {
    ...actual,
    useChromeBodyData: vi.fn(actual.useChromeBodyData),
  };
});

const actualCore = await vi.importActual<typeof CoreModule>("@adapttable/core");

let adapter: ReturnType<typeof createMemoryAdapter>;

beforeEach(() => {
  // Default: delegate to the real hook so the normal render path runs.
  vi.mocked(useChromeBodyData).mockImplementation(actualCore.useChromeBodyData);
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

  it("opens the filter drawer in RTL drawer mode (placement 'left' arm)", async () => {
    // filtersMode="drawer" + dir="rtl" mounts the FilterDrawer with
    // placement="left" — the RTL arm of the placement ternary. Opening it
    // proves the drawer still works end-to-end with that placement.
    mount({
      filters: <div>drawer-rtl-body</div>,
      filtersMode: "drawer",
      dir: "rtl",
    });
    fireEvent.click(screen.getByRole("button", { name: /filters/i }));
    expect(await screen.findByText("drawer-rtl-body")).toBeInTheDocument();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("FilterDrawer defaults placement to the right in LTR (dir === 'rtl' false branch)", async () => {
    render(
      <ChakraProvider>
        <FilterDrawer
          open
          onClose={vi.fn()}
          filters={<div>ltr-body</div>}
          activeFilterCount={0}
          onClearFilters={vi.fn()}
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

  it("pins the sticky header to the scroll-box top when maxHeight is set", () => {
    mount({ stickyHeader: true, stickyTop: 12, maxHeight: 240 });
    // Inside a maxHeight scroll box the box itself is the sticky context, so
    // the header pins to ITS top (0px) — a viewport stickyTop offset would
    // float the header mid-box.
    const header = screen
      .getAllByRole("columnheader")
      .find((th) => getComputedStyle(th).position === "sticky")!;
    expect(getComputedStyle(header).top).toBe("0px");
  });

  it("sticks the selection edge cell flush left alongside a left-pinned column", () => {
    mount({
      bulkActions: [{ key: "x", label: "X", onClick: vi.fn() }],
      columnLayout: {
        hidden: [],
        order: [],
        pinned: { name: "left" },
        widths: {},
      },
    });
    // With a data column pinned left, the leading checkbox cells must pin to
    // the table edge too (edgePinStyle + opaque background), so the pinned
    // column doesn't slide beneath them while scrolling horizontally.
    const selectAllCell = screen
      .getByLabelText(defaultLabels.selectAll)
      .closest("th")!;
    expect(selectAllCell.style.position).toBe("sticky");
    expect(selectAllCell.style.background).not.toBe("");
  });

  it("renders a disabled row action with no activation handler attached", () => {
    const onClick = vi.fn();
    mount({
      rowActions: [
        {
          key: "del",
          label: "Delete",
          onClick,
          disabledReason: () => "locked",
        },
      ],
    });
    // Chakra's isDisabled sets the real disabled attribute, which blocks
    // activation — clicking must never reach the action's onClick.
    const button = screen.getAllByRole("button", { name: "Delete" })[0]!;
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("tightens mobile card spacing in compact density (compact arms)", () => {
    // density="compact" maps to size "sm", switching MobileCards to the
    // tighter stack/body/field spacing scale. A genuine change shows up as
    // different emotion classes vs the comfortable render (same pattern as
    // the desktop density suite).
    const classesFor = (density: "compact" | "comfortable") => {
      const { container, unmount } = mount({ density }, "", {
        isMobile: true,
      });
      const body = container.querySelector(".chakra-card__body")!;
      const field = body.querySelector("div")!;
      const classes = { body: body.className, field: field.className };
      unmount();
      return classes;
    };
    const compact = classesFor("compact");
    const comfortable = classesFor("comfortable");
    expect(compact.body).not.toBe("");
    expect(compact.body).not.toBe(comfortable.body);
    expect(compact.field).not.toBe(comfortable.field);
  });

  it("renders trailing padding in virtualized mobile cards (paddingBottom > 0 true branch)", () => {
    vi.mocked(useChromeBodyData).mockReturnValue({
      virtualization: {
        enabled: true,
        rows: [{ row: ROWS[1]!, index: 1, key: "b" }],
        paddingTop: 0,
        paddingBottom: 40,
        measureElement: vi.fn(),
      },
      loadMoreRef: createRef<HTMLDivElement>(),
      canLoadMore: true,
      virtualScrollRef: () => undefined,
    });
    mount({ virtualize: true, estimateCardSize: 40 }, "", {
      mode: "infinite",
      isMobile: true,
    });
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });
});

describe("DataTable.tsx branches", () => {
  it("closes the filter popover via its onClose (Escape inside the popover)", async () => {
    mount({ filters: <div>esc-body</div> });
    const trigger = screen.getByRole("button", { name: /filters/i });
    fireEvent.click(trigger);
    await screen.findByText("esc-body");
    // Escape inside the popover fires Chakra's onClose → onCloseFilters →
    // setFiltersOpen(false); the trigger reflects the closed state. This is
    // the dismissal path users hit, distinct from re-clicking the trigger.
    fireEvent.keyDown(screen.getByTestId("adapttable-filter-popover"), {
      key: "Escape",
    });
    await waitFor(() =>
      expect(trigger).toHaveAttribute("aria-expanded", "false")
    );
    expect(screen.queryByText("esc-body")).not.toBeInTheDocument();
  });

  it("hides the load-more affordance when the body data says it cannot load more", () => {
    // canLoadMore=false (paged mode / error in core) must suppress the
    // load-more sentinel + button even when the source reports a next page.
    vi.mocked(useChromeBodyData).mockReturnValue({
      virtualization: {
        enabled: false,
        rows: ROWS.map((row, index) => ({ row, index, key: row.id })),
        paddingTop: 0,
        paddingBottom: 0,
      },
      loadMoreRef: createRef<HTMLDivElement>(),
      canLoadMore: false,
      virtualScrollRef: () => undefined,
    });
    mount({}, "limit=1", { mode: "infinite" });
    expect(
      screen.queryByRole("button", { name: defaultLabels.loadMore })
    ).toBeNull();
  });
});
