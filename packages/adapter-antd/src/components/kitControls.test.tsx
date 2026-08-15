import type { QueryFilterGroup } from "@adapttable/core";
import { fireEvent, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import {
  defaultLabels,
  type ExtraFilters,
  type FilterDef,
  type FilterValue,
} from "../index";
import { renderAntd } from "../test-utils";
import { FilterTreeBuilder } from "./FilterTreeBuilder";
import { FilterHeaderControl, FilterHeaderRow } from "./kitControls";

interface Row {
  name: string;
  team: string;
  tags: string[];
  core: boolean;
  age: number;
  hired: string;
}

const DEFS: FilterDef<Row>[] = [
  { key: "name", type: "text", label: "Name" },
  {
    key: "team",
    type: "select",
    label: "Team",
    options: [
      { value: "Core", label: "Core" },
      { value: "Web", label: "Web" },
    ],
  },
  {
    key: "tags",
    type: "multiSelect",
    label: "Tags",
    options: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
    ],
  },
  { key: "core", type: "boolean", label: "Core" },
  { key: "age", type: "numberRange", label: "Age" },
  { key: "hired", type: "dateRange", label: "Hired" },
];

function openSelect(name: string) {
  fireEvent.mouseDown(screen.getByRole("combobox", { name }));
}

function HeaderHarness({ extra: initial = {} }: { extra?: ExtraFilters }) {
  const [extra, setExtra] = useState<ExtraFilters>(initial);
  const source = {
    extra,
    setExtra: (key: string, value: FilterValue) =>
      setExtra((prev) => ({ ...prev, [key]: value })),
    setExtras: (patch: ExtraFilters) =>
      setExtra((prev) => ({ ...prev, ...patch })),
  };
  return (
    <table>
      <caption data-testid="extra">{JSON.stringify(extra)}</caption>
      <thead>
        <FilterHeaderRow
          columns={[
            { key: "name" },
            { key: "team" },
            { key: "tags" },
            { key: "core" },
            { key: "age" },
            { key: "hired" },
          ]}
          defs={DEFS}
          source={source}
          labels={defaultLabels}
        />
      </thead>
    </table>
  );
}

function TreeHarness() {
  const [filterTree, setFilterTree] = useState<QueryFilterGroup | undefined>();
  return (
    <FilterTreeBuilder defs={DEFS} source={{ filterTree, setFilterTree }} />
  );
}

describe("kit header filters (antd)", () => {
  it("writes every compact header widget", () => {
    renderAntd(<HeaderHarness />);
    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "Ada" },
    });
    expect(screen.getByLabelText("Name")).toHaveValue("Ada");
    openSelect("Team");
    fireEvent.click(screen.getByTitle("Core"));
    expect(screen.getByTestId("extra")).toHaveTextContent("Core");
    fireEvent.click(screen.getByLabelText("Tags"));
    fireEvent.click(screen.getByRole("checkbox", { name: "A" }));
    expect(screen.getByRole("checkbox", { name: "A" })).toBeChecked();
    fireEvent.click(screen.getByRole("checkbox", { name: "B" }));
    expect(screen.getByLabelText("Tags")).toHaveTextContent("2");
    openSelect("Core");
    fireEvent.click(screen.getByTitle(defaultLabels.boolTrue));
    expect(screen.getByTestId("extra")).toHaveTextContent("true");
    fireEvent.change(screen.getByLabelText("Age"), {
      target: { value: "30" },
    });
    expect(screen.getByLabelText("Age")).toHaveValue(30);
    fireEvent.change(screen.getByLabelText("Hired"), {
      target: { value: "2024-01-01" },
    });
    expect(screen.getByLabelText("Hired")).toHaveValue("2024-01-01");
  });

  it("writes the upper bound of a between pair", () => {
    renderAntd(
      <HeaderHarness extra={{ ageOp: "between", ageMin: "10", ageMax: "40" }} />
    );
    const bounds = screen.getAllByLabelText("Age");
    expect(bounds).toHaveLength(2);
    fireEvent.change(bounds[1]!, { target: { value: "50" } });
    expect(bounds[1]).toHaveValue(50);
  });

  it("renders a lone header control", () => {
    function One() {
      const [extra, setExtra] = useState<ExtraFilters>({});
      return (
        <>
          <pre data-testid="extra">{JSON.stringify(extra)}</pre>
          <FilterHeaderControl
            def={DEFS[1]!}
            source={{
              extra,
              setExtra: (key, value) =>
                setExtra((prev) => ({ ...prev, [key]: value })),
              setExtras: (patch) => setExtra((prev) => ({ ...prev, ...patch })),
            }}
            labels={defaultLabels}
          />
        </>
      );
    }
    renderAntd(<One />);
    openSelect("Team");
    fireEvent.click(screen.getByTitle("Core"));
    expect(screen.getByTestId("extra")).toHaveTextContent("Core");
  });
});

describe("kit filter tree (antd)", () => {
  it("adds a condition and writes the value", () => {
    renderAntd(<TreeHarness />);
    fireEvent.click(screen.getByText("Advanced"));
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "Ada" },
    });
    expect(screen.getByLabelText("Value")).toHaveValue("Ada");
    const field = screen.getByRole("combobox", { name: "Field" });
    expect(field).toBeInTheDocument();
    expect(screen.getByTitle("Name")).toHaveTextContent("Name");
  });
});
