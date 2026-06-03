import { describe, expect, it, vi } from "vitest";

import { columnResizeHandleProps } from "./columnResize";

/** A fake resize-handle event whose owning cell reports a fixed width. */
function handleEvent(width: number, extra: Record<string, unknown>) {
  const cell = { getBoundingClientRect: () => ({ width }) };
  return {
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    currentTarget: { closest: () => cell } as unknown as HTMLElement,
    ...extra,
  };
}

describe("columnResizeHandleProps", () => {
  it("exposes accessible button semantics", () => {
    const props = columnResizeHandleProps("a", vi.fn(), "Resize A");
    expect(props.role).toBe("button");
    expect(props.tabIndex).toBe(0);
    expect(props["aria-label"]).toBe("Resize A");
  });

  it("resizes on pointer drag from the live cell width", () => {
    const setWidth = vi.fn();
    const props = columnResizeHandleProps("a", setWidth, "Resize A");
    // start at clientX 100, cell width 150
    props.onPointerDown(handleEvent(150, { clientX: 100 }) as never);
    // drag right by 40px
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 140 }));
    expect(setWidth).toHaveBeenLastCalledWith("a", 190);
    document.dispatchEvent(new MouseEvent("pointerup"));
    // after pointerup the listener is detached: further moves do nothing
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: 300 }));
    expect(setWidth).toHaveBeenCalledTimes(1);
  });

  it("clamps the drag to the minimum width", () => {
    const setWidth = vi.fn();
    const props = columnResizeHandleProps("a", setWidth, "Resize A");
    props.onPointerDown(handleEvent(150, { clientX: 100 }) as never);
    document.dispatchEvent(new MouseEvent("pointermove", { clientX: -500 }));
    expect(setWidth).toHaveBeenLastCalledWith("a", 60);
    document.dispatchEvent(new MouseEvent("pointerup"));
  });

  it("nudges width with arrow keys", () => {
    const setWidth = vi.fn();
    const props = columnResizeHandleProps("a", setWidth, "Resize A");
    props.onKeyDown(handleEvent(150, { key: "ArrowRight" }) as never);
    expect(setWidth).toHaveBeenLastCalledWith("a", 166);
    props.onKeyDown(handleEvent(150, { key: "ArrowLeft" }) as never);
    expect(setWidth).toHaveBeenLastCalledWith("a", 134);
    props.onKeyDown(handleEvent(150, { key: "Enter" }) as never);
    expect(setWidth).toHaveBeenCalledTimes(2); // ignored key
  });
});
