import { defaultLabels } from "@adapttable/core";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { FilterPanel } from "./FilterPanel";

describe("FilterPanel", () => {
  it("places the drawer on the left in RTL mode", () => {
    const { container } = render(
      <FilterPanel
        open
        onClose={vi.fn()}
        filters={<div>filters</div>}
        activeFilterCount={0}
        labels={defaultLabels}
        dir="rtl"
        classNames={{ filtersPanel: "panel-rtl" }}
      />
    );
    expect(container.querySelector('[data-dir="rtl"]')).toBeTruthy();
  });

  it("closes when the backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <FilterPanel
        open
        onClose={onClose}
        filters={<div>filters</div>}
        activeFilterCount={0}
        labels={defaultLabels}
        classNames={{}}
      />
    );
    fireEvent.click(
      document.querySelector('[data-adapttable-part="filters-backdrop"]')!
    );
    expect(onClose).toHaveBeenCalled();
  });
});
