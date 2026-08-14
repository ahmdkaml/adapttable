import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";

import { CHECKLIST_VIRTUALIZE_AT } from "./checklist";
import { ChecklistFilter } from "./ChecklistFilter";
import type { FilterDef } from "./filterDefs";

interface Row {
  team: string;
}

const DEF: FilterDef<Row> = { key: "team", type: "checklist", label: "Team" };

const ROWS: Row[] = [{ team: "Core" }, { team: "Core" }, { team: "Web" }];

function Harness({ rows = ROWS }: Readonly<{ rows?: readonly Row[] | null }>) {
  const [extra, setExtra] = useState<Record<string, string[] | undefined>>({});
  return (
    <ChecklistFilter
      def={DEF}
      source={{
        allFilteredRows: rows ?? undefined,
        extra,
        setExtra: (key, value) =>
          setExtra((prev) => ({
            ...prev,
            [key]: Array.isArray(value) ? value : undefined,
          })),
      }}
    />
  );
}

describe("ChecklistFilter", () => {
  it("hides when the source has no full filtered set", () => {
    render(<Harness rows={null} />);
    expect(screen.queryByText("Team")).toBeNull();
  });

  it("renders from facets when the page has no allFilteredRows", () => {
    function FacetHarness() {
      return (
        <ChecklistFilter
          def={DEF}
          source={{
            extra: {},
            setExtra: () => undefined,
            facets: {
              team: [
                { value: "Core", label: "Core", count: 2 },
                { value: "Web", label: "Web", count: 4 },
              ],
            },
          }}
        />
      );
    }
    render(<FacetHarness />);
    expect(screen.getByRole("checkbox", { name: /Web/ })).toBeInTheDocument();
    expect(screen.getByText("(4)")).toBeInTheDocument();
  });

  it("searches, checks one value, and writes the bag", () => {
    render(<Harness />);
    expect(screen.getByText("(2)")).toBeInTheDocument();
    expect(screen.getByText("(1)")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Search values"), {
      target: { value: "web" },
    });
    expect(screen.queryByRole("checkbox", { name: /Core/ })).toBeNull();
    fireEvent.click(screen.getByRole("checkbox", { name: /Web/ }));
    expect(screen.getByRole("checkbox", { name: /Web/ })).toBeChecked();
  });

  it("select-all and clear drive the visible set", () => {
    render(<Harness />);
    fireEvent.click(screen.getByRole("button", { name: "Select all" }));
    expect(screen.getByRole("checkbox", { name: /Core/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /Web/ })).toBeChecked();
    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.getByRole("checkbox", { name: /Core/ })).not.toBeChecked();
  });

  it("windows a long list", () => {
    const many = Array.from(
      { length: CHECKLIST_VIRTUALIZE_AT + 5 },
      (_, i) => ({
        team: `Team ${String(i).padStart(2, "0")}`,
      })
    );
    render(<Harness rows={many} />);
    const list = document.querySelector(
      '[data-adapttable-part="filter-checklist-list"]'
    );
    expect(list).toHaveAttribute("data-virtualized", "true");
    expect(screen.getAllByRole("checkbox").length).toBeLessThan(
      CHECKLIST_VIRTUALIZE_AT
    );
    Object.defineProperty(list, "scrollTop", { value: 800, writable: true });
    fireEvent.scroll(list!);
    expect(
      screen.getByRole("checkbox", { name: /Team 38/ })
    ).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: /Team 00/ })).toBeNull();
  });
});
