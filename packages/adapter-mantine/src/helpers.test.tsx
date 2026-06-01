import type { RowAction } from "@adapttable/core";
import { act, render } from "@testing-library/react";
import { useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useMountStagger } from "./animation/useMountStagger";
import { defaultConfirm } from "./hooks/useConfirm";
import { runRowAction } from "./runAction";

interface Row {
  id: string;
}

describe("runRowAction", () => {
  it("fires immediately without a confirm block", () => {
    const onClick = vi.fn();
    const confirm = vi.fn();
    const action: RowAction<Row> = { key: "a", label: "A", onClick };
    runRowAction(action, { id: "x" }, confirm, "Cancel");
    expect(onClick).toHaveBeenCalledWith({ id: "x" });
    expect(confirm).not.toHaveBeenCalled();
  });

  it("routes through confirm and fires on accept", () => {
    const onClick = vi.fn();
    const confirm = vi.fn((r: { onConfirm: () => void }) => r.onConfirm());
    const action: RowAction<Row> = {
      key: "del",
      label: "Delete",
      onClick,
      confirm: {
        title: "Sure?",
        message: (row) => `Delete ${row.id}?`,
        confirmLabel: "Yes",
        danger: true,
      },
    };
    runRowAction(action, { id: "x" }, confirm, "Cancel");
    expect(confirm).toHaveBeenCalledWith(
      expect.objectContaining({ message: "Delete x?", danger: true })
    );
    expect(onClick).toHaveBeenCalledWith({ id: "x" });
  });
});

describe("defaultConfirm", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("runs onConfirm when the native confirm accepts", () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true)
    );
    const onConfirm = vi.fn();
    defaultConfirm({
      title: "t",
      message: "m",
      confirmLabel: "ok",
      cancelLabel: "no",
      onConfirm,
    });
    expect(onConfirm).toHaveBeenCalled();
  });

  it("skips onConfirm when the native confirm rejects", () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false)
    );
    const onConfirm = vi.fn();
    defaultConfirm({
      title: "t",
      message: "m",
      confirmLabel: "ok",
      cancelLabel: "no",
      onConfirm,
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });
});

function StaggerHarness({ enabled }: { enabled: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  useMountStagger(ref, [], { enabled });
  return (
    <div ref={ref}>
      <span data-stagger="">a</span>
      <span data-stagger="">b</span>
    </div>
  );
}

describe("useMountStagger", () => {
  afterEach(() => {
    delete (Element.prototype as { animate?: unknown }).animate;
  });

  it("animates data-stagger items when enabled", () => {
    const animate = vi.fn();
    (Element.prototype as { animate?: unknown }).animate = animate;
    act(() => {
      render(<StaggerHarness enabled />);
    });
    expect(animate).toHaveBeenCalledTimes(2);
  });

  it("does nothing when disabled", () => {
    const animate = vi.fn();
    (Element.prototype as { animate?: unknown }).animate = animate;
    act(() => {
      render(<StaggerHarness enabled={false} />);
    });
    expect(animate).not.toHaveBeenCalled();
  });
});
