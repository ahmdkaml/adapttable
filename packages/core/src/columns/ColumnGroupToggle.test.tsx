import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { defaultLabels } from "../labels";
import { ColumnGroupToggle } from "./ColumnGroupToggle";
import type { HeaderGroupCell } from "./headerGroups";

const cell = (over: Partial<HeaderGroupCell> = {}): HeaderGroupCell => ({
  key: "g",
  label: "People",
  span: 2,
  id: "People",
  collapsed: false,
  collapsible: true,
  ...over,
});

describe("ColumnGroupToggle", () => {
  it("renders nothing useful until the cell is collapsible", () => {
    const { container } = render(
      <ColumnGroupToggle
        cell={cell({ collapsible: false })}
        labels={defaultLabels}
        onToggle={vi.fn()}
      />
    );
    expect(container.querySelector("button")).toBeNull();
  });

  it("toggles the group and names the control from the labels", () => {
    const onToggle = vi.fn();
    render(
      <ColumnGroupToggle
        cell={cell()}
        labels={defaultLabels}
        onToggle={onToggle}
      />
    );
    const button = screen.getByRole("button", {
      name: defaultLabels.collapseColumnGroup,
    });
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(button);
    expect(onToggle).toHaveBeenCalledWith("People");
  });
});
