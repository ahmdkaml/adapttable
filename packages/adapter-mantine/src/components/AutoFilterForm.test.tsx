import type { ExtraFilters, FilterDef, TableSource } from "@adapttable/core";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderMantine } from "../test-utils";
import { AutoFilterForm } from "./AutoFilterForm";

interface Row {
  id: string;
}

function makeSource(extra: ExtraFilters = {}) {
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

const TAGS_DEF: FilterDef<Row> = {
  key: "tags",
  type: "multiSelect",
  options: [
    { value: "urgent", label: "Urgent" },
    { value: "low", label: "Low" },
  ],
};

describe("<AutoFilterForm>", () => {
  it("text: shows the current value + placeholder and writes the state key", () => {
    const { source, setExtra } = makeSource({ name: "al" });
    renderMantine(
      <AutoFilterForm
        defs={[{ key: "name", type: "text", placeholder: "Find…" }]}
        source={source}
      />
    );
    const input = screen.getByLabelText("Name");
    expect(input).toHaveValue("al");
    expect(input).toHaveAttribute("placeholder", "Find…");
    fireEvent.change(input, { target: { value: "ali" } });
    expect(setExtra).toHaveBeenCalledWith("name", "ali");
    fireEvent.change(input, { target: { value: "" } });
    expect(setExtra).toHaveBeenCalledWith("name", "");
  });

  it("select: prepends a clearing All option and writes the chosen value", () => {
    const { source, setExtra } = makeSource();
    renderMantine(
      <AutoFilterForm
        defs={[{ key: "status", type: "select" }]}
        source={source}
      />
    );
    const select = screen.getByLabelText("Status");
    // No options declared → only the built-in "All" entry, valued "".
    expect(screen.getByRole("option", { name: "All" })).toHaveValue("");
    expect(select).toHaveValue("");
    fireEvent.change(select, { target: { value: "" } });
    expect(setExtra).toHaveBeenCalledWith("status", "");
  });

  it("multiSelect: wraps a scalar URL value and appends on check", () => {
    const { source, setExtra } = makeSource({ tags: "urgent" });
    renderMantine(<AutoFilterForm defs={[TAGS_DEF]} source={source} />);
    expect(screen.getByLabelText("Urgent")).toBeChecked();
    expect(screen.getByLabelText("Low")).not.toBeChecked();
    fireEvent.click(screen.getByLabelText("Low"));
    expect(setExtra).toHaveBeenCalledWith("tags", ["urgent", "low"]);
  });

  it("multiSelect: unchecking the last value clears with an empty array", () => {
    const { source, setExtra } = makeSource({ tags: ["low"] });
    renderMantine(<AutoFilterForm defs={[TAGS_DEF]} source={source} />);
    expect(screen.getByLabelText("Low")).toBeChecked();
    fireEvent.click(screen.getByLabelText("Low"));
    expect(setExtra).toHaveBeenCalledWith("tags", []);
  });

  it("multiSelect: an empty-string value reads as nothing selected", () => {
    const { source } = makeSource({ tags: "" });
    renderMantine(<AutoFilterForm defs={[TAGS_DEF]} source={source} />);
    expect(screen.getByLabelText("Urgent")).not.toBeChecked();
    expect(screen.getByLabelText("Low")).not.toBeChecked();
  });

  it("select: an async loader shows a disabled placeholder, then the options", async () => {
    const { source } = makeSource();
    renderMantine(
      <AutoFilterForm
        defs={[
          {
            key: "status",
            type: "select",
            options: () => Promise.resolve([{ value: "act", label: "Active" }]),
          },
        ]}
        source={source}
      />
    );
    // While the loader is in flight: a single disabled "…" option.
    const placeholder = screen.getByRole("option", { name: "…" });
    expect(placeholder).toBeDisabled();
    expect(screen.queryByRole("option", { name: "All" })).toBeNull();
    // Loaded: the clearing All entry plus the fetched options.
    expect(await screen.findByRole("option", { name: "Active" })).toHaveValue(
      "act"
    );
    expect(screen.getByRole("option", { name: "All" })).toHaveValue("");
    expect(screen.queryByRole("option", { name: "…" })).toBeNull();
  });

  it("multiSelect: an async loader shows a spinner, then the checkboxes", async () => {
    const { source } = makeSource();
    const { container } = renderMantine(
      <AutoFilterForm
        defs={[
          {
            key: "tags",
            type: "multiSelect",
            options: () =>
              Promise.resolve([{ value: "urgent", label: "Urgent" }]),
          },
        ]}
        source={source}
      />
    );
    // While the loader is in flight: a Loader instead of checkboxes.
    expect(container.querySelector(".mantine-Loader-root")).not.toBeNull();
    expect(screen.queryByLabelText("Urgent")).toBeNull();
    // Loaded: the checkboxes replace the spinner.
    expect(await screen.findByLabelText("Urgent")).not.toBeChecked();
    expect(container.querySelector(".mantine-Loader-root")).toBeNull();
  });

  it("dateRange: renders From/To date inputs and writes the paired keys", () => {
    const { source, setExtra } = makeSource({ hiredFrom: "2026-01-01" });
    renderMantine(
      <AutoFilterForm
        defs={[{ key: "hired", type: "dateRange" }]}
        source={source}
      />
    );
    const from = screen.getByLabelText("Hired From");
    const to = screen.getByLabelText("Hired To");
    expect(from).toHaveAttribute("type", "date");
    expect(from).toHaveValue("2026-01-01");
    expect(to).toHaveValue("");
    fireEvent.change(to, { target: { value: "2026-02-01" } });
    expect(setExtra).toHaveBeenCalledWith("hiredTo", "2026-02-01");
    fireEvent.change(from, { target: { value: "" } });
    expect(setExtra).toHaveBeenCalledWith("hiredFrom", "");
  });

  it("numberRange: renders Min/Max number inputs and writes the paired keys", () => {
    const { source, setExtra } = makeSource({ budgetMin: 100 });
    renderMantine(
      <AutoFilterForm
        defs={[{ key: "budget", type: "numberRange", label: "Budget" }]}
        source={source}
      />
    );
    const min = screen.getByLabelText("Budget Min");
    const max = screen.getByLabelText("Budget Max");
    expect(min).toHaveAttribute("type", "number");
    expect(min).toHaveValue(100);
    fireEvent.change(max, { target: { value: "900" } });
    expect(setExtra).toHaveBeenCalledWith("budgetMax", "900");
    fireEvent.change(min, { target: { value: "150" } });
    expect(setExtra).toHaveBeenCalledWith("budgetMin", "150");
  });
});
