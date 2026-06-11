import type { FilterDef } from "@adapttable/core";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AutoFilterForm } from "./components/AutoFilterForm";

const roleDefs: FilterDef<unknown>[] = [
  {
    key: "role",
    type: "multiSelect",
    options: [{ value: "admin", label: "Admin" }],
  },
];

describe("<AutoFilterForm> (Ant Design)", () => {
  it("tolerates a scalar multiSelect value (treats it as one selection)", () => {
    render(
      <AutoFilterForm
        defs={roleDefs}
        source={{ extra: { role: "admin" }, setExtra: vi.fn() }}
      />
    );
    expect(screen.getByRole("checkbox", { name: "Admin" })).toBeChecked();
  });

  it("treats an empty-string multiSelect value as nothing selected", () => {
    render(
      <AutoFilterForm
        defs={roleDefs}
        source={{ extra: { role: "" }, setExtra: vi.fn() }}
      />
    );
    expect(screen.getByRole("checkbox", { name: "Admin" })).not.toBeChecked();
  });

  it("renders only the All option for a select without options", () => {
    render(
      <AutoFilterForm
        defs={[{ key: "city", type: "select" }]}
        source={{ extra: {}, setExtra: vi.fn() }}
      />
    );
    const select = screen.getByLabelText<HTMLSelectElement>("City");
    expect(select.options).toHaveLength(1);
    expect(select.options[0]).toHaveTextContent("All");
  });

  it("renders an options-less multiSelect as an empty group", () => {
    const { container } = render(
      <AutoFilterForm
        defs={[{ key: "role", type: "multiSelect" }]}
        source={{ extra: {}, setExtra: vi.fn() }}
      />
    );
    expect(container.querySelectorAll('input[type="checkbox"]')).toHaveLength(
      0
    );
  });
});
