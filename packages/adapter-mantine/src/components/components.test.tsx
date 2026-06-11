import type { SelectionState } from "@adapttable/core";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { defaultLabels } from "../index";
import { renderMantine } from "../test-utils";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { BulkActionBar } from "./BulkActionBar";
import { EmptyState } from "./EmptyState";
import { FilterPopover } from "./FilterPopover";
import { PaginationFooter } from "./PaginationFooter";
import { TableSkeleton } from "./TableSkeleton";

const labels = defaultLabels;

describe("EmptyState", () => {
  it("renders title, description and a custom icon", () => {
    renderMantine(
      <EmptyState
        title="Nothing"
        description="try again"
        icon={<span data-testid="ic">★</span>}
      />
    );
    expect(screen.getByText("Nothing")).toBeInTheDocument();
    expect(screen.getByText("try again")).toBeInTheDocument();
    expect(screen.getByTestId("ic")).toBeInTheDocument();
  });
});

describe("ActiveFilterChips", () => {
  it("renders nothing when empty", () => {
    const { container } = renderMantine(
      <ActiveFilterChips chips={[]} label="f" clearAllLabel="Clear all" />
    );
    expect(container.querySelector("ul")).toBeNull();
  });

  it("renders chips, fires remove, and fires clear-all", () => {
    const onRemove = vi.fn();
    const onClearAll = vi.fn();
    renderMantine(
      <ActiveFilterChips
        chips={[{ key: "k", label: "Status: Active", onRemove }]}
        onClearAll={onClearAll}
        label="filters"
        clearAllLabel="Clear all"
      />
    );
    expect(screen.getByText("Status: Active")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Clear all"));
    expect(onClearAll).toHaveBeenCalled();
    fireEvent.click(screen.getByLabelText("Clear all: Status: Active"));
    expect(onRemove).toHaveBeenCalled();
  });
});

describe("PaginationFooter", () => {
  it("changes page via the pager", () => {
    const onPageChange = vi.fn();
    renderMantine(
      <PaginationFooter
        page={1}
        totalPages={5}
        limit={25}
        total={120}
        fromIndex={1}
        toIndex={25}
        onPageChange={onPageChange}
        onLimitChange={vi.fn()}
        labels={labels}
      />
    );
    fireEvent.click(screen.getByText("2"));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("labels the next-page control", () => {
    renderMantine(
      <PaginationFooter
        page={1}
        totalPages={5}
        limit={25}
        total={120}
        fromIndex={1}
        toIndex={25}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
        labels={labels}
      />
    );
    expect(
      screen.getByRole("button", { name: labels.nextPage })
    ).toBeInTheDocument();
  });

  it("hides the showing-range when total is 0", () => {
    renderMantine(
      <PaginationFooter
        page={1}
        totalPages={0}
        limit={25}
        total={0}
        fromIndex={0}
        toIndex={0}
        onPageChange={vi.fn()}
        onLimitChange={vi.fn()}
        labels={labels}
      />
    );
    expect(screen.queryByText(/Showing/)).toBeNull();
  });
});

describe("TableSkeleton", () => {
  it("renders without an optional loading label", () => {
    renderMantine(<TableSkeleton columns={0} rows={1} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.queryByText(labels.loading)).toBeNull();
  });
});

function makeSelection(count: number): SelectionState {
  return {
    selectedIds: new Set(count > 0 ? ["a", "b"].slice(0, count) : []),
    selectedCount: count,
    headerState: count > 0 ? "all" : "none",
    isSelected: () => true,
    toggle: vi.fn(),
    toggleAll: vi.fn(),
    clear: vi.fn(),
    visibleIds: ["a", "b"],
  };
}

describe("BulkActionBar", () => {
  it("renders nothing with an empty selection", () => {
    renderMantine(
      <BulkActionBar
        selection={makeSelection(0)}
        bulkActions={[{ key: "x", label: "X", onClick: vi.fn() }]}
        confirm={vi.fn()}
        labels={labels}
      />
    );
    expect(screen.queryByText("X")).toBeNull();
    expect(screen.queryByText(/selected/)).toBeNull();
  });

  it("runs a no-confirm action immediately", () => {
    const onClick = vi.fn().mockResolvedValue(undefined);
    renderMantine(
      <BulkActionBar
        selection={makeSelection(2)}
        bulkActions={[{ key: "x", label: "Archive", onClick }]}
        confirm={vi.fn()}
        labels={labels}
      />
    );
    expect(screen.getByText("2 selected")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Archive"));
    expect(onClick).toHaveBeenCalledWith(["a", "b"]);
  });

  it("disables a button with a disabledReason and shows the tooltip text", () => {
    const onClick = vi.fn();
    renderMantine(
      <BulkActionBar
        selection={makeSelection(2)}
        bulkActions={[
          {
            key: "x",
            label: "Delete",
            onClick,
            disabledReason: () => "Referenced elsewhere",
          },
        ]}
        confirm={vi.fn()}
        labels={labels}
      />
    );
    const btn = screen.getByText("Delete").closest("button");
    expect(btn).toBeDisabled();
    fireEvent.click(screen.getByText("Delete"));
    expect(onClick).not.toHaveBeenCalled();
  });

  // Contract: only a *non-empty* reason disables. An empty string must be
  // treated as "no reason" — the action stays enabled and keeps its label.
  it("keeps the action enabled when disabledReason returns an empty string", () => {
    const onClick = vi.fn().mockResolvedValue(undefined);
    renderMantine(
      <BulkActionBar
        selection={makeSelection(2)}
        bulkActions={[
          { key: "x", label: "Archive", onClick, disabledReason: () => "" },
        ]}
        confirm={vi.fn()}
        labels={labels}
      />
    );
    const btn = screen.getByText("Archive").closest("button");
    expect(btn).not.toBeDisabled();
    fireEvent.click(screen.getByText("Archive"));
    expect(onClick).toHaveBeenCalledWith(["a", "b"]);
  });
});

describe("FilterPopover", () => {
  it("a target click requests opening and never fires onClose", () => {
    const onClose = vi.fn();
    renderMantine(
      <FilterPopover
        open={false}
        onClose={onClose}
        onClearFilters={vi.fn()}
        filters={<div>f</div>}
        activeFilterCount={0}
        labels={defaultLabels}
      >
        <button type="button">Open filters</button>
      </FilterPopover>
    );
    // Mantine reports the toggle through onChange(true); closing is the only
    // transition this component forwards.
    fireEvent.click(screen.getByRole("button", { name: "Open filters" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
