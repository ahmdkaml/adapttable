import type { ExtraFilters, FilterOption, TableSource } from "@adapttable/core";
import { act, fireEvent, render, screen, within } from "@testing-library/react";
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
    sortLevels: [],
    toggleSortLevel: () => undefined,
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

/** A controllable async option source: resolve it mid-test, act-wrapped. */
function deferredLoader() {
  let resolve!: (value: readonly FilterOption[]) => void;
  const loader = () =>
    new Promise<readonly FilterOption[]>((res) => {
      resolve = res;
    });
  const resolveWith = (value: readonly FilterOption[]) =>
    act(async () => {
      resolve(value);
      await Promise.resolve();
    });
  return { loader, resolveWith };
}

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

  it("select: async options render a single disabled placeholder, then the choices", async () => {
    const { source } = stubSource({});
    const { loader, resolveWith } = deferredLoader();
    render(
      <AutoFilterForm<Row>
        defs={[{ key: "city", type: "select", options: loader }]}
        source={source}
      />
    );
    const select = screen.getByRole("combobox", { name: "City" });
    // While the loader is in flight: exactly one disabled "…" option.
    const placeholder = within(select).getByRole("option", { name: "…" });
    expect(placeholder).toBeDisabled();
    expect(within(select).getAllByRole("option")).toHaveLength(1);

    await resolveWith(OPTIONS);
    // Loaded: the "All" choice plus the resolved options replace it.
    expect(within(select).getAllByRole("option")).toHaveLength(3);
    expect(
      within(select).getByRole("option", { name: "Alpha" })
    ).toBeInTheDocument();
    expect(within(select).queryByRole("option", { name: "…" })).toBeNull();
  });

  it("multiSelect: async options render the loading hook, then checkboxes", async () => {
    const { source } = stubSource({});
    const { loader, resolveWith } = deferredLoader();
    render(
      <AutoFilterForm<Row>
        defs={[{ key: "tags", type: "multiSelect", options: loader }]}
        source={source}
        classNames={{ filterOptionsLoading: "c-loading" }}
      />
    );
    // While loading: no checkboxes, just the classed loading placeholder.
    const loading = document.querySelector(
      '[data-adapttable-part="filter-options-loading"]'
    );
    expect(loading).toHaveClass("c-loading");
    expect(loading).toHaveTextContent("…");
    expect(screen.queryAllByRole("checkbox")).toHaveLength(0);

    await resolveWith(OPTIONS);
    expect(
      document.querySelector('[data-adapttable-part="filter-options-loading"]')
    ).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Alpha" })).toBeInTheDocument();
    expect(screen.getByRole("checkbox", { name: "Beta" })).toBeInTheDocument();
  });
});
