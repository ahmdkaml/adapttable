import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Shift {
  id: string;
  approved: boolean;
  day: string;
  startsAt: string;
  reviewedAt: string;
  tags: string[];
}

const ROWS: Shift[] = [
  {
    id: "1",
    approved: false,
    day: "2026-08-13",
    startsAt: "09:30",
    reviewedAt: "2026-08-13T14:05",
    tags: ["urgent"],
  },
];

const COLS: ColumnDef<Shift>[] = [
  { key: "approved", header: "Approved", editable: true, editor: "boolean" },
  { key: "day", header: "Day", editable: true, editor: "date" },
  { key: "startsAt", header: "Starts", editable: true, editor: "time" },
  {
    key: "reviewedAt",
    header: "Reviewed",
    editable: true,
    editor: "datetime",
  },
  {
    key: "tags",
    header: "Tags",
    editable: true,
    editor: {
      type: "multi-select",
      options: ["urgent", "billable", "remote"],
    },
  },
];

const activates = () =>
  document.querySelectorAll<HTMLElement>(
    '[data-adapttable-part="edit-cell-activate"]'
  );
const editor = () =>
  document.querySelector<HTMLElement>(
    '[data-adapttable-part="edit-cell-editor"]'
  )!;

/**
 * The editors beyond text, number and select.
 *
 * Each one uses the platform's own control, so what matters is the round trip:
 * the stored value seeds the editor in the shape that control holds, and what it
 * commits is a value the host can store back without parsing.
 */
describe("editor set (mui)", () => {
  const table = () => {
    const onCellEdit = vi.fn();
    render(
      <DataTable
        data={ROWS}
        columns={COLS}
        rowKey={(r) => r.id}
        urlSync={false}
        onCellEdit={onCellEdit}
      />
    );
    return { onCellEdit };
  };
  const open = (index: number) => {
    fireEvent.doubleClick(activates()[index]!);
  };

  it("commits a boolean in one gesture", () => {
    const { onCellEdit } = table();
    open(0);
    expect(editor()).toHaveAttribute("type", "checkbox");
    expect(editor()).not.toBeChecked();
    fireEvent.click(editor());
    // A checkbox has one gesture: no Enter, no blur.
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "approved",
      true
    );
  });

  it("seeds a date editor with the day it holds, and commits one back", () => {
    const { onCellEdit } = table();
    open(1);
    expect(editor()).toHaveAttribute("type", "date");
    expect(editor()).toHaveValue("2026-08-13");
    fireEvent.change(editor(), { target: { value: "2026-09-01" } });
    fireEvent.keyDown(editor(), { key: "Enter" });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "day",
      "2026-09-01"
    );
  });

  it("uses the platform's time control", () => {
    const { onCellEdit } = table();
    open(2);
    expect(editor()).toHaveAttribute("type", "time");
    expect(editor()).toHaveValue("09:30");
    fireEvent.change(editor(), { target: { value: "07:15" } });
    fireEvent.keyDown(editor(), { key: "Enter" });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "startsAt",
      "07:15"
    );
  });

  it("uses the platform's datetime control", () => {
    const { onCellEdit } = table();
    open(3);
    expect(editor()).toHaveAttribute("type", "datetime-local");
    expect(editor()).toHaveValue("2026-08-13T14:05");
    fireEvent.change(editor(), { target: { value: "2026-08-14T08:00" } });
    fireEvent.keyDown(editor(), { key: "Enter" });
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(
      ROWS[0],
      "reviewedAt",
      "2026-08-14T08:00"
    );
  });

  it("commits a multi-select as the array it chose", () => {
    const { onCellEdit } = table();
    open(4);
    const select = editor() as HTMLSelectElement;
    expect(select.multiple).toBe(true);
    // Seeded from the stored array — no `editValue` needed for the round trip.
    expect([...select.selectedOptions].map((o) => o.value)).toEqual(["urgent"]);

    select.options[1]!.selected = true;
    fireEvent.change(select);
    fireEvent.blur(select);
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(ROWS[0], "tags", [
      "urgent",
      "billable",
    ]);
  });

  it("commits an empty multi-select as an empty array, not an empty string", () => {
    const { onCellEdit } = table();
    open(4);
    const select = editor() as HTMLSelectElement;
    select.options[0]!.selected = false;
    fireEvent.change(select);
    fireEvent.blur(select);
    expect(onCellEdit).toHaveBeenCalledExactlyOnceWith(ROWS[0], "tags", []);
  });
});
