import type { TableLabels } from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { Toolbar, type ToolbarProps } from "./components/Toolbar";

interface Row {
  id: string;
  name: string;
}

const labels = {
  search: "Search records",
  sortBy: "Sort by",
  filters: "Filters",
  rowsPerPage: "Rows per page",
} as Required<
  Pick<TableLabels, "search" | "sortBy" | "filters" | "rowsPerPage">
>;

function makeToolbarProps(): ToolbarProps<Row> {
  const onSearchChange = vi.fn();
  const setSort = vi.fn();
  const setLimit = vi.fn();

  return {
    table: {
      labels,
      isMobile: false,
      source: {
        sortBy: "name",
        sortDir: "asc",
        limit: 10,
        setSort,
        setLimit,
      },
      getSearchInputProps: (overrides?: { placeholder?: string }) => ({
        type: "search" as const,
        role: "searchbox",
        "aria-label": labels.search,
        value: "test query",
        placeholder: overrides?.placeholder ?? "Search...",
        onChange: onSearchChange,
      }),
    } as unknown as ToolbarProps<Row>["table"],
    searchable: true,
    sortByOptions: [
      { label: "Name", value: "name" },
      { label: "Date", value: "date" },
    ],
    hasFilters: true,
    activeFilterCount: 2,
    filtersMode: "popover",
    filtersOpen: false,
    onToggleFilters: vi.fn(),
    onFiltersTriggerPointerDown: vi.fn(),
    onCloseFilters: vi.fn(),
    onClearFilters: vi.fn(),
    showRowsPerPage: true,
    exportLabel: "Export CSV",
    onExportCsv: vi.fn(),
    exportBusy: false,
  };
}

describe("Toolbar", () => {
  it("renders search input, sort selector, filters button, and export action", () => {
    const props = makeToolbarProps();
    render(<Toolbar {...props} />);

    expect(screen.getByLabelText(labels.search)).toBeInTheDocument();
    expect(screen.getByLabelText(labels.sortBy)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Filters/i })
    ).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Export CSV" })
    ).toBeInTheDocument();
  });

  it("handles search input change", () => {
    const props = makeToolbarProps();
    const onChange = vi.fn();
    props.table.getSearchInputProps = (overrides) => ({
      type: "search" as const,
      role: "searchbox",
      "aria-label": labels.search,
      value: "",
      placeholder:
        typeof overrides?.placeholder === "string"
          ? overrides.placeholder
          : "Search...",
      onChange,
    });

    render(<Toolbar {...props} />);

    fireEvent.change(screen.getByLabelText(labels.search), {
      target: { value: "Alice" },
    });

    expect(onChange).toHaveBeenCalled();
  });

  it("triggers sort change", () => {
    const props = makeToolbarProps();
    render(<Toolbar {...props} />);

    const select = screen.getByLabelText(labels.sortBy);
    fireEvent.change(select, { target: { value: "date" } });

    expect(props.table.source.setSort).toHaveBeenCalledWith("date", "asc");
  });

  it("triggers filter toggle", () => {
    const props = makeToolbarProps();
    render(<Toolbar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: /Filters/i }));
    expect(props.onToggleFilters).toHaveBeenCalled();
  });

  it("triggers export CSV handler", () => {
    const props = makeToolbarProps();
    render(<Toolbar {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
    expect(props.onExportCsv).toHaveBeenCalled();
  });
});
