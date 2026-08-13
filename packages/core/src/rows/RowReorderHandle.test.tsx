/**
 * The grip and the mobile up/down buttons are the only reorder UI kits
 * render. Prove they call through to the headless state.
 */
import { fireEvent, render, renderHook, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useRowReorder } from "./rowReorder";
import {
  RowReorderAnnouncer,
  RowReorderButtons,
  RowReorderHandle,
} from "./RowReorderHandle";

interface Task {
  id: string;
}

const ROW: Task = { id: "a" };
const LABELS = {
  reorderRow: "Reorder row",
  moveRowUp: "Move row up",
  moveRowDown: "Move row down",
  rowLifted: (position: number) => `Row ${String(position)} lifted`,
  rowMoved: (from: number, to: number) =>
    `Row moved from ${String(from)} to ${String(to)}`,
  rowReorderCancelled: "Reorder cancelled",
};

describe("RowReorderHandle", () => {
  it("lifts on Space from the grip", () => {
    const onRowReorder = vi.fn();
    const { result } = renderHook(() =>
      useRowReorder<Task>({
        enabled: true,
        onRowReorder,
        labels: LABELS,
        rowAt: () => ROW,
      })
    );
    const { rerender } = render(
      <RowReorderHandle
        reorder={result.current}
        labels={LABELS}
        rowId="a"
        localIndex={0}
        row={ROW}
        windowStart={0}
        rowCount={3}
      />
    );
    fireEvent.keyDown(screen.getByRole("button", { name: "Reorder row" }), {
      key: " ",
    });
    rerender(
      <RowReorderHandle
        reorder={result.current}
        labels={LABELS}
        rowId="a"
        localIndex={0}
        row={ROW}
        windowStart={0}
        rowCount={3}
      />
    );
    expect(result.current.lifted?.rowId).toBe("a");
  });
});

describe("RowReorderButtons", () => {
  it("moves down, and disables up on the first card", () => {
    const onRowReorder = vi.fn();
    const { result } = renderHook(() =>
      useRowReorder<Task>({
        enabled: true,
        onRowReorder,
        labels: LABELS,
        rowAt: () => ROW,
      })
    );
    render(
      <>
        <RowReorderAnnouncer announcement={result.current.announcement} />
        <RowReorderButtons
          reorder={result.current}
          labels={LABELS}
          localIndex={0}
          row={ROW}
          windowStart={0}
          rowCount={3}
        />
      </>
    );
    expect(screen.getByRole("button", { name: "Move row up" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Move row down" }));
    expect(onRowReorder).toHaveBeenCalledExactlyOnceWith(0, 1, ROW);
  });
});
