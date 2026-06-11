import { fireEvent, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { ExtraFilters, FilterDef, FilterValue } from "../index";
import { renderChakra } from "../test-utils";
import { AutoFilterForm } from "./AutoFilterForm";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];
const TAG_OPTIONS = [
  { value: "a", label: "Alpha" },
  { value: "b", label: "Beta" },
];

function renderForm(defs: readonly FilterDef[], extra: ExtraFilters = {}) {
  const setExtra = vi.fn<(key: string, value: FilterValue) => void>();
  renderChakra(<AutoFilterForm defs={defs} source={{ extra, setExtra }} />);
  return setExtra;
}

describe("<AutoFilterForm> (Chakra)", () => {
  it("text: labels from the humanized key, shows the placeholder, writes the key", () => {
    const setExtra = renderForm([
      { key: "firstName", type: "text", placeholder: "Type a name" },
    ]);
    const input = screen.getByLabelText("First Name");
    expect(input).toHaveAttribute("placeholder", "Type a name");
    expect(input).toHaveValue("");
    fireEvent.change(input, { target: { value: "ali" } });
    expect(setExtra).toHaveBeenCalledWith("firstName", "ali");
  });

  it("select: renders an empty All option, reads the value, writes the key, '' clears", () => {
    const setExtra = renderForm(
      [{ key: "status", type: "select", options: STATUS_OPTIONS }],
      { status: "active" }
    );
    const select = screen.getByLabelText("Status");
    expect(select).toHaveValue("active");
    expect(
      within(select)
        .getAllByRole("option")
        .map((o) => o.textContent)
    ).toEqual(["All", "Active", "Inactive"]);
    fireEvent.change(select, { target: { value: "inactive" } });
    expect(setExtra).toHaveBeenCalledWith("status", "inactive");
    fireEvent.change(select, { target: { value: "" } });
    expect(setExtra).toHaveBeenCalledWith("status", "");
  });

  it("select and multiSelect without options render only their static chrome", () => {
    renderForm([
      { key: "plan", type: "select" },
      { key: "tags", type: "multiSelect" },
    ]);
    const select = screen.getByLabelText("Plan");
    expect(within(select).getAllByRole("option")).toHaveLength(1);
    expect(screen.getByText("Tags")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();
  });

  it("multiSelect: tolerates a scalar value and appends the next selection", () => {
    const setExtra = renderForm(
      [{ key: "tags", type: "multiSelect", options: TAG_OPTIONS }],
      { tags: "a" }
    );
    expect(screen.getByLabelText("Alpha")).toBeChecked();
    expect(screen.getByLabelText("Beta")).not.toBeChecked();
    fireEvent.click(screen.getByLabelText("Beta"));
    expect(setExtra).toHaveBeenCalledWith("tags", ["a", "b"]);
  });

  it("multiSelect: unchecking the last option writes [] (clears)", () => {
    const setExtra = renderForm(
      [{ key: "tags", type: "multiSelect", options: TAG_OPTIONS }],
      { tags: ["a"] }
    );
    fireEvent.click(screen.getByLabelText("Alpha"));
    expect(setExtra).toHaveBeenCalledWith("tags", []);
  });

  it("multiSelect: an empty-string value means nothing is selected", () => {
    renderForm([{ key: "tags", type: "multiSelect", options: TAG_OPTIONS }], {
      tags: "",
    });
    expect(screen.getByLabelText("Alpha")).not.toBeChecked();
    expect(screen.getByLabelText("Beta")).not.toBeChecked();
  });

  it("dateRange: reads and writes the From/To state keys as date inputs", () => {
    const setExtra = renderForm([{ key: "hiredAt", type: "dateRange" }], {
      hiredAtFrom: "2026-01-01",
    });
    const from = screen.getByLabelText("Hired At From");
    expect(from).toHaveAttribute("type", "date");
    expect(from).toHaveValue("2026-01-01");
    fireEvent.change(from, { target: { value: "2026-02-01" } });
    expect(setExtra).toHaveBeenCalledWith("hiredAtFrom", "2026-02-01");
    fireEvent.change(screen.getByLabelText("Hired At To"), {
      target: { value: "2026-03-31" },
    });
    expect(setExtra).toHaveBeenCalledWith("hiredAtTo", "2026-03-31");
  });

  it("numberRange: reads numbers from the URL state and writes the Min/Max keys", () => {
    const setExtra = renderForm(
      [{ key: "age", type: "numberRange", label: "Age" }],
      { ageMin: 30 }
    );
    const min = screen.getByLabelText("Age Min");
    expect(min).toHaveAttribute("type", "number");
    expect(min).toHaveValue(30);
    fireEvent.change(min, { target: { value: "21" } });
    expect(setExtra).toHaveBeenCalledWith("ageMin", "21");
    fireEvent.change(screen.getByLabelText("Age Max"), {
      target: { value: "55" },
    });
    expect(setExtra).toHaveBeenCalledWith("ageMax", "55");
  });
});
