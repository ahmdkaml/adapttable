import { type GroupedFlatEntry, type SelectionState } from "@adapttable/core";
import { fireEvent, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { defaultLabels } from "../index";
import { renderBaseUi } from "../test-utils";
import { Table } from "../ui";
import { GroupHeaderCard, GroupHeaderRow } from "./GroupHeader";

interface Row {
  id: string;
  team: string;
  name: string;
}

type GroupEntry = Extract<GroupedFlatEntry<Row>, { kind: "group" }>;

const GROUP_KEY = "group:team:Core";
const LEAF_IDS = ["1", "2"] as const;
const labels = defaultLabels;

function makeGroupEntry(overrides: Partial<GroupEntry> = {}): GroupEntry {
  return {
    kind: "group",
    key: GROUP_KEY,
    value: "Core",
    label: "Core",
    leafRows: [{ id: "1", team: "Core", name: "Ada" }],
    leafIds: LEAF_IDS,
    collapsed: false,
    ...overrides,
  };
}

function makeSelection(
  selectedIds: readonly string[],
  overrides: Partial<SelectionState> = {}
): SelectionState {
  const selected = new Set(selectedIds);
  return {
    selectedIds: selected,
    selectedCount: selectedIds.length,
    headerState: "none",
    isSelected: (id) => selected.has(id),
    toggle: vi.fn(),
    toggleAll: vi.fn(),
    toggleGroupLeaves: vi.fn(),
    clear: vi.fn(),
    visibleIds: [...LEAF_IDS, "3"],
    allMatching: false,
    selectAllMatching: vi.fn(),
    ...overrides,
  };
}

function renderRow(
  props: Partial<Parameters<typeof GroupHeaderRow<Row>>[0]> = {}
) {
  const onToggleCollapse = props.onToggleCollapse ?? vi.fn();
  renderBaseUi(
    <Table.Root>
      <Table.Body>
        <GroupHeaderRow
          entry={makeGroupEntry()}
          columnSpan={3}
          selection={null}
          labels={labels}
          onToggleCollapse={onToggleCollapse}
          {...props}
        />
      </Table.Body>
    </Table.Root>
  );
  return { onToggleCollapse };
}

describe("GroupHeaderRow (base-ui)", () => {
  it("renders label, count, aggregates, and group hooks", () => {
    renderRow({
      entry: makeGroupEntry({
        aggregateCells: { name: <span>agg</span> },
      }),
    });
    expect(
      document.querySelector('[data-adapttable-part="group-row"]')
    ).toBeInTheDocument();
    expect(
      document.querySelector('[data-adapttable-part="group-cell"]')
    ).toBeInTheDocument();
    expect(screen.getByText("Core")).toHaveAttribute(
      "data-adapttable-part",
      "group-label"
    );
    expect(
      screen.getByText(labels.groupCount(LEAF_IDS.length))
    ).toHaveAttribute("data-adapttable-part", "group-count");
    expect(
      document.querySelector(
        '[data-adapttable-part="group-aggregate"][data-column="name"]'
      )
    ).toHaveTextContent("agg");
  });

  it("calls onToggleCollapse when collapsed", () => {
    const { onToggleCollapse } = renderRow({
      entry: makeGroupEntry({ collapsed: true }),
    });
    const toggle = screen.getByRole("button", { name: labels.expandGroup });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(onToggleCollapse).toHaveBeenCalledWith(GROUP_KEY);
  });

  it("uses collapse label when expanded", () => {
    renderRow({ entry: makeGroupEntry({ collapsed: false }) });
    expect(
      screen.getByRole("button", { name: labels.collapseGroup })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("omits the group checkbox without selection", () => {
    renderRow({ selection: null });
    expect(
      document.querySelector('[data-adapttable-part="group-select"]')
    ).toBeNull();
  });

  it("reflects tri-state selection and toggles group leaves", () => {
    const selection = makeSelection(["1"]);
    renderRow({ selection });
    const checkbox = screen.getByRole("checkbox", { name: labels.selectAll });
    expect(checkbox).toBePartiallyChecked();
    fireEvent.click(checkbox);
    expect(selection.toggleGroupLeaves).toHaveBeenCalledWith(LEAF_IDS);

    const all = makeSelection(LEAF_IDS);
    renderRow({ selection: all });
    expect(
      screen.getAllByRole("checkbox", { name: labels.selectAll })[1]
    ).toBeChecked();
  });
});

describe("GroupHeaderCard (base-ui)", () => {
  it("renders the mobile group card", () => {
    const onToggleCollapse = vi.fn();
    const selection = makeSelection(LEAF_IDS);
    renderBaseUi(
      <GroupHeaderCard
        entry={makeGroupEntry({ collapsed: true })}
        selection={selection}
        labels={labels}
        onToggleCollapse={onToggleCollapse}
      />
    );
    expect(
      document.querySelector('[data-adapttable-part="group-card"]')
    ).toHaveAttribute("data-collapsed", "true");
    fireEvent.click(screen.getByRole("button", { name: labels.expandGroup }));
    expect(onToggleCollapse).toHaveBeenCalledWith(GROUP_KEY);
    fireEvent.click(screen.getByRole("checkbox", { name: labels.selectAll }));
    expect(selection.toggleGroupLeaves).toHaveBeenCalledWith(LEAF_IDS);
  });
});
