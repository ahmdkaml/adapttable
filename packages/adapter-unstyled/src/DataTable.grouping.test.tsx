/**
 * Row grouping smoke: arms the grouping branch in components/tables.tsx via
 * frontend data + an opt-in `groupBy` prop (same pattern as expansion tests).
 */
import { createMemoryAdapter, useFrontendData } from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Row {
  id: string;
  team: string;
  name: string;
}

const ROWS: Row[] = [
  { id: "1", team: "Core", name: "Ada" },
  { id: "2", team: "Platform", name: "Alan" },
  { id: "3", team: "Core", name: "Grace" },
];

const columns: ColumnDef<Row>[] = [
  { key: "team", header: "Team", accessor: (r) => r.team, sortable: true },
  { key: "name", header: "Name", accessor: (r) => r.name },
];

let adapter: ReturnType<typeof createMemoryAdapter>;

function Harness(props: {
  isMobile?: boolean;
  override?: Partial<Parameters<typeof DataTable<Row>>[0]>;
}) {
  const source = useFrontendData<Row>({
    data: ROWS,
    adapter,
    columns,
  });
  return (
    <DataTable
      source={source}
      columns={columns}
      rowKey={(r) => r.id}
      isMobile={props.isMobile}
      groupBy="team"
      groupAggregates={(rows) => ({ name: rows.length })}
      {...props.override}
    />
  );
}

function renderHarness(props: Parameters<typeof Harness>[0] = {}) {
  adapter = createMemoryAdapter("");
  return render(<Harness {...props} />);
}

const part = (name: string) =>
  document.querySelector(`[data-adapttable-part="${name}"]`);

beforeEach(() => vi.useFakeTimers({ shouldAdvanceTime: true }));
afterEach(() => vi.useRealTimers());

describe("<DataTable> row grouping (unstyled)", () => {
  it("renders desktop group headers with aggregates and collapses on toggle", () => {
    renderHarness();
    expect(part("group-row")).toBeInTheDocument();
    expect(
      document.querySelector('[data-adapttable-part="group-label"]')
    ).toHaveTextContent("Core");
    expect(
      document.querySelectorAll('[data-adapttable-part="group-label"]')
    ).toHaveLength(2);
    expect(
      screen.getByText("Platform", {
        selector: "[data-adapttable-part=group-label]",
      })
    ).toBeInTheDocument();
    expect(screen.getAllByText("(2)").length).toBeGreaterThan(0);
    expect(part("group-aggregate")).toBeInTheDocument();

    const toggle = document.querySelector(
      '[data-adapttable-part="group-toggle"]'
    )!;
    fireEvent.click(toggle);
    expect(part("group-row")).toHaveAttribute("data-collapsed", "true");
    expect(screen.queryByText("Ada")).toBeNull();
  });

  it("renders mobile group cards when isMobile is set", () => {
    renderHarness({ isMobile: true });
    expect(part("group-card")).toBeInTheDocument();
    expect(
      document.querySelectorAll('[data-adapttable-part="group-label"]')
    ).toHaveLength(2);
    expect(screen.getByText("Alan")).toBeInTheDocument();
  });

  it("shows a group-select checkbox when bulk actions arm selection", () => {
    renderHarness({
      override: {
        bulkActions: [{ key: "x", label: "Archive", onClick: vi.fn() }],
      },
    });
    expect(part("group-select")).toBeInTheDocument();
  });
});
