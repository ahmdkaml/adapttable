import type { FilterDef, FilterOption } from "@adapttable/core";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AutoFilterForm } from "./components/AutoFilterForm";

/** A promise of options whose resolution the test controls. */
function deferredOptions() {
  let resolve: (options: readonly FilterOption[]) => void = () => undefined;
  const promise = new Promise<readonly FilterOption[]>((res) => {
    resolve = res;
  });
  return { loader: () => promise, resolve };
}

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

  it("shows a disabled placeholder option while async select options load, then the loaded options", async () => {
    const { loader, resolve } = deferredOptions();
    render(
      <AutoFilterForm
        defs={[{ key: "city", type: "select", options: loader }]}
        source={{ extra: {}, setExtra: vi.fn() }}
      />
    );
    // While the loader is in flight: "All" plus one disabled "…" option.
    const select = screen.getByLabelText<HTMLSelectElement>("City");
    expect(select.options).toHaveLength(2);
    expect(select.options[1]).toBeDisabled();
    expect(select.options[1]).toHaveTextContent("…");

    await act(async () => {
      resolve([{ value: "dxb", label: "Dubai" }]);
      await Promise.resolve();
    });
    expect(select.options).toHaveLength(2);
    expect(select.options[1]).toHaveTextContent("Dubai");
    expect(select.options[1]).not.toBeDisabled();
    expect(select.options[1]).toHaveValue("dxb");
  });

  it("shows a small spinner while async multiSelect options load, then the checkboxes", async () => {
    const { loader, resolve } = deferredOptions();
    const { container } = render(
      <AutoFilterForm
        defs={[{ key: "role", type: "multiSelect", options: loader }]}
        source={{ extra: {}, setExtra: vi.fn() }}
      />
    );
    expect(container.querySelector(".ant-spin")).toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).toBeNull();

    await act(async () => {
      resolve([{ value: "admin", label: "Admin" }]);
      await Promise.resolve();
    });
    expect(container.querySelector(".ant-spin")).toBeNull();
    expect(screen.getByRole("checkbox", { name: "Admin" })).toBeInTheDocument();
  });
});
