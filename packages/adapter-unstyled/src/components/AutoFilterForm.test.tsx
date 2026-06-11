import type { ExtraFilters, TableSource } from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AutoFilterForm } from "./AutoFilterForm";

interface Row {
  id: string;
}

function stubSource(extra: ExtraFilters) {
  const setExtra = vi.fn();
  const source: TableSource<Row> = {
    rows: [],
    total: 0,
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
    extra,
    setPage: () => undefined,
    setLimit: () => undefined,
    setSort: () => undefined,
    setSearch: () => undefined,
    setExtra,
    setExtras: () => undefined,
    clearExtras: () => undefined,
    clearAll: () => undefined,
  };
  return { source, setExtra };
}

const OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

describe("<AutoFilterForm> standalone", () => {
  it("multiSelect tolerates a scalar bag value and toggles around it", () => {
    const { source, setExtra } = stubSource({ tags: "a" });
    render(
      <AutoFilterForm<Row>
        defs={[{ key: "tags", type: "multiSelect", options: OPTIONS }]}
        source={source}
      />
    );
    expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "Beta" })).not.toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "Beta" }));
    expect(setExtra).toHaveBeenCalledWith("tags", ["a", "b"]);
    fireEvent.click(screen.getByRole("checkbox", { name: "Alpha" }));
    expect(setExtra).toHaveBeenCalledWith("tags", []);
  });

  it("treats an empty-string bag value as nothing selected and renders option-less groups", () => {
    const { source } = stubSource({ tags: "" });
    render(
      <AutoFilterForm<Row>
        defs={[
          { key: "tags", type: "multiSelect", options: OPTIONS },
          // No options declared → just the captioned (humanized) group.
          { key: "bare", type: "multiSelect" },
        ]}
        source={source}
      />
    );
    expect(screen.getByRole("checkbox", { name: "Alpha" })).not.toBeChecked();
    expect(screen.getByText("Bare")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")).toHaveLength(2);
  });
});
