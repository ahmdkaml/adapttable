import {
  defaultFilterRegistry,
  defaultLabels,
  type ExtraFilters,
  type FilterDef,
  type TableLabels,
  type TableSource,
} from "@adapttable/core";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { renderMantine } from "../test-utils";
import { AutoFilterForm } from "./AutoFilterForm";

interface Row {
  id: string;
}

function makeSource(
  extra: ExtraFilters = {},
  allFilteredRows?: readonly Row[]
) {
  const setExtra = vi.fn();
  const setExtras = vi.fn();
  const source: TableSource<Row> = {
    rows: [],
    allFilteredRows,
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
    groupBy: undefined,
    extra,
    setPage: () => undefined,
    setLimit: () => undefined,
    setSort: () => undefined,
    setGroupBy: () => undefined,
    sortLevels: [],
    toggleSortLevel: () => undefined,
    setSearch: () => undefined,
    setExtra,
    setExtras,
    clearExtras: () => undefined,
    clearAll: () => undefined,
  };
  return { source, setExtra, setExtras };
}

const renderForm = (
  defs: readonly FilterDef<Row>[],
  source: TableSource<Row>,
  labels: Required<TableLabels> = defaultLabels
) =>
  renderMantine(<AutoFilterForm defs={defs} source={source} labels={labels} />);

/** Open a range widget's operator select (a Mantine 9 combobox). */
const openOperatorSelect = (name: string) => {
  const trigger = screen.getByRole("combobox", { name });
  fireEvent.click(trigger);
  return trigger;
};

/** Open the operator select and click one of its options. */
const pickOperator = (selectName: string, optionLabel: string) => {
  openOperatorSelect(selectName);
  fireEvent.click(screen.getByRole("option", { name: optionLabel }));
};

const TAGS_DEF: FilterDef<Row> = {
  key: "tags",
  type: "multiSelect",
  options: [
    { value: "urgent", label: "Urgent" },
    { value: "low", label: "Low" },
  ],
};

const BUDGET_DEF: FilterDef<Row> = {
  key: "budget",
  type: "numberRange",
  label: "Budget",
};

const HIRED_DEF: FilterDef<Row> = { key: "hired", type: "dateRange" };

describe("<AutoFilterForm>", () => {
  it("checklist hides without allFilteredRows and checks a counted value", () => {
    const hidden = makeSource();
    renderForm(
      [{ key: "team", type: "checklist", getValue: () => "Core" }],
      hidden.source
    );
    expect(screen.queryByLabelText("Search values")).toBeNull();
    const { source, setExtra } = makeSource({}, [{ id: "1" }]);
    renderForm(
      [{ key: "team", type: "checklist", getValue: () => "Core" }],
      source
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /Core/ }));
    expect(setExtra).toHaveBeenCalledWith("team", ["Core"]);
  });

  it("text: shows the current value + placeholder and writes the state key", () => {
    const { source, setExtras } = makeSource({ name: "al" });
    renderForm([{ key: "name", type: "text", placeholder: "Find…" }], source);
    const input = screen.getByLabelText("Name");
    expect(input).toHaveValue("al");
    expect(input).toHaveAttribute("placeholder", "Find…");
    fireEvent.change(input, { target: { value: "ali" } });
    expect(setExtras).toHaveBeenCalledWith({
      name: "ali",
      nameOp: "contains",
    });
    fireEvent.change(input, { target: { value: "" } });
    expect(setExtras).toHaveBeenCalledWith({
      name: undefined,
      nameOp: undefined,
    });
  });

  it("boolean: tri-state select writes true and clears", () => {
    const { source, setExtra } = makeSource();
    renderForm([{ key: "core", type: "boolean", label: "Core team" }], source);
    const select = screen.getByLabelText("Core team");
    fireEvent.change(select, { target: { value: "true" } });
    expect(setExtra).toHaveBeenCalledWith("core", "true");
    fireEvent.change(select, { target: { value: "" } });
    expect(setExtra).toHaveBeenCalledWith("core", undefined);
  });

  it("select: prepends a clearing All option and writes the chosen value", () => {
    const { source, setExtra } = makeSource();
    renderForm([{ key: "status", type: "select" }], source);
    const select = screen.getByLabelText("Status");
    // No options declared → only the built-in "All" entry, valued "".
    expect(screen.getByRole("option", { name: "All" })).toHaveValue("");
    expect(select).toHaveValue("");
    fireEvent.change(select, { target: { value: "" } });
    expect(setExtra).toHaveBeenCalledWith("status", "");
  });

  it("multiSelect: wraps a scalar URL value and appends on check", () => {
    const { source, setExtra } = makeSource({ tags: "urgent" });
    renderForm([TAGS_DEF], source);
    expect(screen.getByLabelText("Urgent")).toBeChecked();
    expect(screen.getByLabelText("Low")).not.toBeChecked();
    fireEvent.click(screen.getByLabelText("Low"));
    expect(setExtra).toHaveBeenCalledWith("tags", ["urgent", "low"]);
  });

  it("multiSelect: unchecking the last value clears with an empty array", () => {
    const { source, setExtra } = makeSource({ tags: ["low"] });
    renderForm([TAGS_DEF], source);
    expect(screen.getByLabelText("Low")).toBeChecked();
    fireEvent.click(screen.getByLabelText("Low"));
    expect(setExtra).toHaveBeenCalledWith("tags", []);
  });

  it("multiSelect: an empty-string value reads as nothing selected", () => {
    const { source } = makeSource({ tags: "" });
    renderForm([TAGS_DEF], source);
    expect(screen.getByLabelText("Urgent")).not.toBeChecked();
    expect(screen.getByLabelText("Low")).not.toBeChecked();
  });

  it("select: an async loader shows a disabled placeholder, then the options", async () => {
    const { source } = makeSource();
    renderForm(
      [
        {
          key: "status",
          type: "select",
          options: () => Promise.resolve([{ value: "act", label: "Active" }]),
        },
      ],
      source
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
    const { container } = renderForm(
      [
        {
          key: "tags",
          type: "multiSelect",
          options: () =>
            Promise.resolve([{ value: "urgent", label: "Urgent" }]),
        },
      ],
      source
    );
    // While the loader is in flight: a Loader instead of checkboxes.
    expect(container.querySelector(".mantine-Loader-root")).not.toBeNull();
    expect(screen.queryByLabelText("Urgent")).toBeNull();
    // Loaded: the checkboxes replace the spinner.
    expect(await screen.findByLabelText("Urgent")).not.toBeChecked();
    expect(container.querySelector(".mantine-Loader-root")).toBeNull();
  });

  it("numberRange: the operator select lists the localized number operators", () => {
    const { source } = makeSource();
    renderForm([BUDGET_DEF], source, {
      ...defaultLabels,
      opAtLeast: "Mindestens",
    });
    // No operator yet → no value input, just the labeled select.
    expect(screen.queryByRole("textbox", { name: "Budget Value" })).toBeNull();
    openOperatorSelect("Budget Operator");
    expect(screen.getByRole("option", { name: "Equal" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "Mindestens" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "At most" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Between" })).toBeInTheDocument();
  });

  it("numberRange: choosing At least + typing writes the Min key only", () => {
    const { source, setExtras } = makeSource();
    renderForm([BUDGET_DEF], source);
    pickOperator("Budget Operator", "At least");
    // Choosing with no value yet keeps the pair clear.
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: undefined,
      budgetMax: undefined,
      budgetOp: undefined,
    });
    fireEvent.change(screen.getByRole("textbox", { name: "Budget Value" }), {
      target: { value: "150" },
    });
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: "150",
      budgetMax: undefined,
      budgetOp: "gte",
    });
  });

  it("numberRange: choosing Equal + typing writes BOTH keys with one value", () => {
    const { source, setExtras } = makeSource();
    renderForm([BUDGET_DEF], source);
    pickOperator("Budget Operator", "Equal");
    fireEvent.change(screen.getByRole("textbox", { name: "Budget Value" }), {
      target: { value: "5" },
    });
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: "5",
      budgetMax: "5",
      budgetOp: "eq",
    });
  });

  it("numberRange: a Max-only URL mounts as At most and rewrites the Max key", () => {
    const { source, setExtras } = makeSource({ budgetMax: 700 });
    renderForm([BUDGET_DEF], source);
    expect(
      screen.getByRole("combobox", { name: "Budget Operator" })
    ).toHaveValue("At most");
    const value = screen.getByRole("textbox", { name: "Budget Value" });
    expect(value).toHaveValue("700");
    fireEvent.change(value, { target: { value: "200" } });
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: undefined,
      budgetMax: "200",
      budgetOp: "lte",
    });
  });

  it("numberRange: Between shows labeled From/To inputs and writes both keys", () => {
    const { source, setExtras } = makeSource({
      budgetMin: 100,
      budgetMax: 900,
    });
    renderForm([BUDGET_DEF], source);
    expect(
      screen.getByRole("combobox", { name: "Budget Operator" })
    ).toHaveValue("Between");
    const from = screen.getByRole("textbox", { name: "Budget From" });
    const to = screen.getByRole("textbox", { name: "Budget To" });
    expect(from).toHaveValue("100");
    expect(to).toHaveValue("900");
    fireEvent.change(to, { target: { value: "1200" } });
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: "100",
      budgetMax: "1200",
      budgetOp: "between",
    });
    fireEvent.change(from, { target: { value: "150" } });
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: "150",
      budgetMax: "900",
      budgetOp: "between",
    });
  });

  it("numberRange: clearing the operator clears both keys", () => {
    const { source, setExtras } = makeSource({
      budgetMin: 100,
      budgetMax: 900,
    });
    renderForm([BUDGET_DEF], source);
    // Clicking the selected option deselects it (Mantine allowDeselect).
    pickOperator("Budget Operator", "Between");
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: undefined,
      budgetMax: undefined,
      budgetOp: undefined,
    });
  });

  it("numberRange: equal URL bounds mount as Equal, and switching keeps the value", () => {
    const { source, setExtras } = makeSource({ budgetMin: 5, budgetMax: 5 });
    renderForm([BUDGET_DEF], source);
    expect(
      screen.getByRole("combobox", { name: "Budget Operator" })
    ).toHaveValue("Equal");
    expect(screen.getByRole("textbox", { name: "Budget Value" })).toHaveValue(
      "5"
    );
    // Switching the operator carries the value across.
    pickOperator("Budget Operator", "At least");
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: "5",
      budgetMax: undefined,
      budgetOp: "gte",
    });
  });

  it("numberRange: emptying the value clears the pair but keeps the operator", () => {
    const { source, setExtras } = makeSource({ budgetMin: 100 });
    renderForm([BUDGET_DEF], source);
    const operator = screen.getByRole("combobox", { name: "Budget Operator" });
    expect(operator).toHaveValue("At least");
    fireEvent.change(screen.getByRole("textbox", { name: "Budget Value" }), {
      target: { value: "" },
    });
    expect(setExtras).toHaveBeenLastCalledWith({
      budgetMin: undefined,
      budgetMax: undefined,
      budgetOp: undefined,
    });
    expect(operator).toHaveValue("At least");
  });

  it("dateRange: the operator select lists the localized date operators", () => {
    const { source } = makeSource();
    renderForm([HIRED_DEF], source);
    openOperatorSelect("Hired Operator");
    expect(screen.getByRole("option", { name: "On" })).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "On or after" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("option", { name: "On or before" })
    ).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Between" })).toBeInTheDocument();
  });

  it("dateRange: choosing On or after + picking a date writes the From key only", () => {
    const { source, setExtras } = makeSource();
    renderForm([HIRED_DEF], source);
    pickOperator("Hired Operator", "On or after");
    const value = screen.getByLabelText("Hired Value");
    expect(value).toHaveAttribute("type", "date");
    fireEvent.change(value, { target: { value: "2026-01-01" } });
    expect(setExtras).toHaveBeenLastCalledWith({
      hiredFrom: "2026-01-01",
      hiredTo: undefined,
      hiredOp: "gte",
    });
  });

  it("dateRange: Between shows From/To date inputs and writes both keys", () => {
    const { source, setExtras } = makeSource({
      hiredFrom: "2026-01-01",
      hiredTo: "2026-02-01",
    });
    renderForm([HIRED_DEF], source);
    expect(
      screen.getByRole("combobox", { name: "Hired Operator" })
    ).toHaveValue("Between");
    const from = screen.getByLabelText("Hired From");
    const to = screen.getByLabelText("Hired To");
    expect(from).toHaveAttribute("type", "date");
    expect(from).toHaveValue("2026-01-01");
    expect(to).toHaveValue("2026-02-01");
    fireEvent.change(from, { target: { value: "2026-01-15" } });
    expect(setExtras).toHaveBeenLastCalledWith({
      hiredFrom: "2026-01-15",
      hiredTo: "2026-02-01",
      hiredOp: "between",
    });
    fireEvent.change(to, { target: { value: "2026-03-01" } });
    expect(setExtras).toHaveBeenLastCalledWith({
      hiredFrom: "2026-01-01",
      hiredTo: "2026-03-01",
      hiredOp: "between",
    });
  });

  it("renders a custom type through the registry widget kind", () => {
    const text = defaultFilterRegistry.get("text")!;
    const registry = defaultFilterRegistry.register({
      ...text,
      type: "personText",
    });
    const { source } = makeSource();
    renderMantine(
      <AutoFilterForm
        defs={[
          {
            key: "name",
            type: "personText",
            label: "Name",
            placeholder: "Find…",
          },
        ]}
        source={source}
        labels={defaultLabels}
        registry={registry}
      />
    );
    expect(screen.getByPlaceholderText("Find…")).toBeVisible();
  });
});
