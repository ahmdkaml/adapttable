import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import type { QueryFilterGroup } from "../source/queryContract";
import { defaultFilterRegistry } from "./filterBuiltins";
import type { FilterDef } from "./filterDefs";
import { FilterTreeBuilder } from "./FilterTreeBuilder";

interface Row {
  name: string;
  core: boolean;
  budget: number;
  start: string;
}

const DEFS: FilterDef<Row>[] = [
  { key: "name", type: "text", label: "Person" },
  { key: "core", type: "boolean", label: "Core" },
  { key: "budget", type: "numberRange", label: "Budget" },
  { key: "start", type: "dateRange", label: "Start" },
];

function Harness({ initial }: Readonly<{ initial?: QueryFilterGroup }> = {}) {
  const [filterTree, setFilterTree] = useState<QueryFilterGroup | undefined>(
    initial
  );
  return (
    <FilterTreeBuilder defs={DEFS} source={{ filterTree, setFilterTree }} />
  );
}

describe("FilterTreeBuilder", () => {
  it("adds a condition and writes the value into the tree", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "Ada" },
    });
    expect(screen.getByLabelText("Field")).toHaveValue("name");
    expect(screen.getByLabelText("Value")).toHaveValue("Ada");
  });

  it("switches field, operator, combinator, and nests a group", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    fireEvent.change(screen.getByLabelText("Field"), {
      target: { value: "budget" },
    });
    fireEvent.change(screen.getByLabelText("Operator"), {
      target: { value: "between" },
    });
    fireEvent.change(screen.getByLabelText("From"), { target: { value: "1" } });
    fireEvent.change(screen.getByLabelText("To"), { target: { value: "9" } });
    fireEvent.change(screen.getByLabelText("Advanced"), {
      target: { value: "or" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add group" }));
    expect(screen.getAllByLabelText("Advanced")).toHaveLength(2);
    fireEvent.click(screen.getByRole("button", { name: "Remove group" }));
    fireEvent.click(screen.getByRole("button", { name: "Remove condition" }));
    expect(screen.getByRole("button", { name: "Add condition" })).toBeVisible();
  });

  it("edits a boolean leaf and a relative date", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    fireEvent.change(screen.getByLabelText("Field"), {
      target: { value: "core" },
    });
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "false" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add condition" }));
    const fields = screen.getAllByLabelText("Field");
    fireEvent.change(fields[1]!, { target: { value: "start" } });
    fireEvent.change(screen.getByLabelText("Operator"), {
      target: { value: "relative" },
    });
    fireEvent.change(screen.getByLabelText("Relative"), {
      target: { value: "last" },
    });
    fireEvent.change(screen.getByLabelText("N"), { target: { value: "14" } });
    expect(screen.getByLabelText("N")).toHaveValue(14);
  });

  it("starts from Add group and a list operator", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Add group" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Add condition" })[1]!
    );
    fireEvent.change(screen.getByLabelText("Field"), {
      target: { value: "budget" },
    });
    fireEvent.change(screen.getByLabelText("Operator"), {
      target: { value: "in" },
    });
    fireEvent.change(screen.getByLabelText("Value"), {
      target: { value: "1,2" },
    });
    expect(screen.getByLabelText("Value")).toHaveValue("1,2");
  });

  it("renders nothing without defs or a setter", () => {
    const { container } = render(
      <FilterTreeBuilder defs={[]} source={{ filterTree: undefined }} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("stringifies numeric and boolean bounds", () => {
    render(
      <Harness
        initial={{
          combinator: "and",
          conditions: [{ key: "budget", op: "between", value: [4, 9] }],
        }}
      />
    );
    expect(screen.getByLabelText("From")).toHaveValue(4);
    expect(screen.getByLabelText("To")).toHaveValue(9);
  });

  it("hydrates an existing tree and a valueless op", () => {
    render(
      <Harness
        initial={{
          combinator: "and",
          conditions: [{ key: "name", op: "empty" }],
        }}
      />
    );
    expect(screen.getByLabelText("Operator")).toHaveValue("empty");
    expect(screen.queryByLabelText("Value")).toBeNull();
  });

  it("shows an empty value input for a non-scalar condition", () => {
    render(
      <Harness
        initial={{
          combinator: "and",
          conditions: [{ key: "name", op: "eq", value: { x: 1 } }],
        }}
      />
    );
    expect(screen.getByLabelText("Value")).toHaveValue("");
  });

  it("labels unknown-widget operators with the raw op token", () => {
    const text = defaultFilterRegistry.get("text")!;
    const registry = defaultFilterRegistry.register({
      ...text,
      type: "sku",
      widget: "select",
      ops: ["eq", "soundsLike"],
      defaultOp: "eq",
    });
    render(
      <FilterTreeBuilder
        defs={[{ key: "sku", type: "sku", label: "SKU" }]}
        source={{
          filterTree: {
            combinator: "and",
            conditions: [{ key: "sku", op: "soundsLike", value: "ab" }],
          },
          setFilterTree: () => undefined,
        }}
        registry={registry}
      />
    );
    expect(
      screen.getByRole("option", { name: "soundsLike" })
    ).toBeInTheDocument();
  });
});
