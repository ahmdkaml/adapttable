import { describe, expect, it, vi } from "vitest";

import {
  COLUMN_DND_MIME,
  columnDropProps,
  columnReorderKeyProps,
  columnRowDragProps,
} from "./columnReorder";

/** A minimal in-memory DataTransfer stand-in for jsdom drag events. */
function fakeDataTransfer(initial: Record<string, string> = {}) {
  const store: Record<string, string> = { ...initial };
  return {
    effectAllowed: "",
    dropEffect: "",
    get types() {
      return Object.keys(store);
    },
    setData: vi.fn((type: string, value: string) => {
      store[type] = value;
    }),
    getData: vi.fn((type: string) => store[type] ?? ""),
  };
}

function dragEvent(dataTransfer: unknown, extra: Record<string, unknown> = {}) {
  return { preventDefault: vi.fn(), dataTransfer, ...extra };
}

describe("columnRowDragProps", () => {
  it("makes the row draggable and writes the column key on drag start", () => {
    const props = columnRowDragProps("a");
    expect(props.draggable).toBe(true);
    const dt = fakeDataTransfer();
    props.onDragStart(dragEvent(dt) as never);
    expect(dt.setData).toHaveBeenCalledWith(COLUMN_DND_MIME, "a");
    expect(dt.effectAllowed).toBe("move");
  });

  it("cancels the drag when it starts on an interactive control", () => {
    const props = columnRowDragProps("a");
    const dt = fakeDataTransfer();
    const button = document.createElement("button");
    const icon = document.createElement("span");
    button.append(icon);
    // Drag started on the pin/eye button (or an icon inside it): cancel so the
    // button's click still fires; nothing is written to the transfer.
    const event = dragEvent(dt, { target: icon, preventDefault: vi.fn() });
    props.onDragStart(event as never);
    expect(event.preventDefault).toHaveBeenCalled();
    expect(dt.setData).not.toHaveBeenCalled();
  });

  it("starts the drag from the row body (a non-control target)", () => {
    const props = columnRowDragProps("a");
    const dt = fakeDataTransfer();
    const rowBody = document.createElement("div");
    props.onDragStart(dragEvent(dt, { target: rowBody }) as never);
    expect(dt.setData).toHaveBeenCalledWith(COLUMN_DND_MIME, "a");
  });

  it("starts the drag from the grip even when the kit renders it as a button", () => {
    // Mantine/MUI/Chakra render the grip as an icon BUTTON; the interactive-
    // control cancel must not eat the strongest drag affordance of all.
    const props = columnRowDragProps("a");
    const dt = fakeDataTransfer();
    const grip = document.createElement("button");
    grip.setAttribute("data-adapttable-grip", "");
    const icon = document.createElement("span");
    grip.append(icon);
    const event = dragEvent(dt, { target: icon, preventDefault: vi.fn() });
    props.onDragStart(event as never);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(dt.setData).toHaveBeenCalledWith(COLUMN_DND_MIME, "a");
  });
});

describe("columnReorderKeyProps", () => {
  it("exposes an accessible focusable grip", () => {
    const props = columnReorderKeyProps("a", 0, vi.fn(), "Reorder A");
    expect(props.role).toBe("button");
    expect(props.tabIndex).toBe(0);
    expect(props["aria-label"]).toBe("Reorder A");
  });

  it("moves backward/forward with arrow keys", () => {
    const move = vi.fn();
    const props = columnReorderKeyProps("a", 3, move, "Reorder A");
    props.onKeyDown(dragEvent(null, { key: "ArrowLeft" }) as never);
    expect(move).toHaveBeenLastCalledWith("a", 2);
    props.onKeyDown(dragEvent(null, { key: "ArrowUp" }) as never);
    expect(move).toHaveBeenLastCalledWith("a", 2);
    props.onKeyDown(dragEvent(null, { key: "ArrowRight" }) as never);
    expect(move).toHaveBeenLastCalledWith("a", 4);
    props.onKeyDown(dragEvent(null, { key: "ArrowDown" }) as never);
    expect(move).toHaveBeenLastCalledWith("a", 4);
  });

  it("flips ArrowLeft/ArrowRight under dir=rtl (Up/Down stay logical)", () => {
    const move = vi.fn();
    const props = columnReorderKeyProps("a", 3, move, "Reorder A");
    const root = document.createElement("div");
    root.setAttribute("dir", "rtl");
    const grip = document.createElement("span");
    root.append(grip);
    // Visually-right is toward the START in RTL.
    props.onKeyDown(
      dragEvent(null, { key: "ArrowRight", currentTarget: grip }) as never
    );
    expect(move).toHaveBeenLastCalledWith("a", 2);
    props.onKeyDown(
      dragEvent(null, { key: "ArrowLeft", currentTarget: grip }) as never
    );
    expect(move).toHaveBeenLastCalledWith("a", 4);
    props.onKeyDown(
      dragEvent(null, { key: "ArrowUp", currentTarget: grip }) as never
    );
    expect(move).toHaveBeenLastCalledWith("a", 2);
    props.onKeyDown(
      dragEvent(null, { key: "ArrowDown", currentTarget: grip }) as never
    );
    expect(move).toHaveBeenLastCalledWith("a", 4);
  });

  it("marks the grip so row-drag exempts it from the control cancel", () => {
    const props = columnReorderKeyProps("a", 0, vi.fn(), "Reorder A");
    expect(props["data-adapttable-grip"]).toBe("");
  });

  it("ignores non-arrow keys", () => {
    const move = vi.fn();
    const props = columnReorderKeyProps("a", 3, move, "Reorder A");
    props.onKeyDown(dragEvent(null, { key: "Enter" }) as never);
    expect(move).not.toHaveBeenCalled();
  });
});

describe("columnDropProps", () => {
  it("accepts a drop carrying a column key and moves it to the index", () => {
    const move = vi.fn();
    const props = columnDropProps(1, move);
    const dt = fakeDataTransfer({ [COLUMN_DND_MIME]: "b" });
    const over = dragEvent(dt);
    props.onDragOver(over as never);
    expect(over.preventDefault).toHaveBeenCalled();
    expect(dt.dropEffect).toBe("move");
    const drop = dragEvent(dt);
    props.onDrop(drop as never);
    expect(drop.preventDefault).toHaveBeenCalled();
    expect(move).toHaveBeenCalledWith("b", 1);
  });

  it("ignores dragover/drop without a column payload", () => {
    const move = vi.fn();
    const props = columnDropProps(1, move);
    const over = dragEvent(fakeDataTransfer({ "text/plain": "x" }));
    props.onDragOver(over as never);
    expect(over.preventDefault).not.toHaveBeenCalled();
    const drop = dragEvent(fakeDataTransfer());
    props.onDrop(drop as never);
    expect(move).not.toHaveBeenCalled();
  });
});

describe("direction detection without a [dir] ancestor", () => {
  it("falls back to the computed style direction", () => {
    const move = vi.fn();
    const props = columnReorderKeyProps("a", 3, move, "Reorder A");
    const grip = document.createElement("span");
    document.body.append(grip); // no [dir] anywhere up the tree
    props.onKeyDown(
      dragEvent(null, { key: "ArrowLeft", currentTarget: grip }) as never
    );
    // jsdom computes direction "ltr" → ArrowLeft moves toward the start.
    expect(move).toHaveBeenLastCalledWith("a", 2);
    grip.remove();
  });
});
