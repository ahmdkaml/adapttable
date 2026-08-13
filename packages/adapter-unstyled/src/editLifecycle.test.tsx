import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { DataTable } from "./DataTable";
import type { ColumnDef } from "./index";

interface Task {
  id: string;
  title: string;
}

const ROWS: Task[] = [{ id: "1", title: "Ship" }];
const COLS: ColumnDef<Task>[] = [
  { key: "title", header: "Title", accessor: (r) => r.title, editable: true },
];

const part = (name: string) =>
  document.querySelector<HTMLElement>(`[data-adapttable-part="${name}"]`);

describe("edit lifecycle (unstyled)", () => {
  it("fires start, commit and cancel from the cell the reader typed in", () => {
    const onEditStart = vi.fn();
    const onEditCommit = vi.fn();
    const onEditCancel = vi.fn();
    const onCellEdit = vi.fn();
    render(
      <DataTable
        data={ROWS}
        columns={COLS}
        rowKey={(r) => r.id}
        urlSync={false}
        onCellEdit={onCellEdit}
        onEditStart={onEditStart}
        onEditCommit={onEditCommit}
        onEditCancel={onEditCancel}
      />
    );
    fireEvent.doubleClick(part("edit-cell-activate")!);
    expect(onEditStart).toHaveBeenCalledOnce();
    const editor = part("edit-cell-editor")!;
    fireEvent.change(editor, { target: { value: "Ship it" } });
    fireEvent.keyDown(editor, { key: "Enter" });
    expect(onCellEdit).toHaveBeenCalledOnce();
    expect(onEditCommit).toHaveBeenCalledOnce();

    fireEvent.doubleClick(part("edit-cell-activate")!);
    fireEvent.keyDown(part("edit-cell-editor")!, { key: "Escape" });
    expect(onEditCancel).toHaveBeenCalledOnce();
  });
});
