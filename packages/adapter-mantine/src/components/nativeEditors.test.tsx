/**
 * The platform controls two editors render.
 *
 * Both are cases where the browser already ships the better answer, so what
 * these cover is the wiring around them: the draft shape each holds, and the
 * gesture that commits.
 */
import {
  type EditableCellEditorCtrl,
  formatMultiDraft,
} from "@adapttable/core";
import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { NativeBooleanEditor, NativeMultiSelectEditor } from "./nativeEditors";

const ctrlFor = (
  over: Partial<EditableCellEditorCtrl> = {}
): EditableCellEditorCtrl => ({
  draft: "",
  setDraft: vi.fn(),
  onEditorKeyDown: vi.fn(),
  commitOnBlur: vi.fn(),
  editor: "text",
  selectOptions: [],
  validating: false,
  errorId: "err-1",
  focusRef: () => undefined,
  ...over,
});

describe("NativeBooleanEditor", () => {
  it("reflects the draft and commits on the tick", () => {
    const ctrl = ctrlFor({ draft: "false", editor: "boolean" });
    render(
      <NativeBooleanEditor
        ctrl={ctrl}
        label="Approved"
        className="bool-cls"
        onKeyDown={() => undefined}
      />
    );
    const box = document.querySelector<HTMLInputElement>("input")!;
    expect(box.type).toBe("checkbox");
    expect(box.checked).toBe(false);

    fireEvent.click(box);
    expect(ctrl.setDraft).toHaveBeenCalledExactlyOnceWith("true");
    expect(ctrl.commitOnBlur).toHaveBeenCalledOnce();
  });

  it("shows a ticked box for a true draft", () => {
    render(
      <NativeBooleanEditor
        ctrl={ctrlFor({ draft: "true", editor: "boolean" })}
        label="Approved"
        onKeyDown={() => undefined}
      />
    );
    expect(document.querySelector<HTMLInputElement>("input")!.checked).toBe(
      true
    );
  });

  it("carries the validation ARIA", () => {
    render(
      <NativeBooleanEditor
        ctrl={ctrlFor({ editor: "boolean", error: "no", validating: true })}
        label="Approved"
        onKeyDown={() => undefined}
      />
    );
    const box = document.querySelector("input")!;
    expect(box).toHaveAttribute("aria-invalid", "true");
    expect(box).toHaveAttribute("aria-describedby", "err-1");
    expect(box).toHaveAttribute("aria-busy", "true");
  });
});

describe("NativeMultiSelectEditor", () => {
  const options = [
    { value: "urgent", label: "Urgent" },
    { value: "billable", label: "Billable" },
  ];

  it("seeds itself from the draft and writes the chosen values back", () => {
    const ctrl = ctrlFor({
      draft: "urgent",
      editor: { type: "multi-select", options },
      selectOptions: options,
    });
    render(
      <NativeMultiSelectEditor
        ctrl={ctrl}
        label="Tags"
        className="multi-cls"
        onKeyDown={() => undefined}
      />
    );
    const select = document.querySelector<HTMLSelectElement>("select")!;
    expect(select.multiple).toBe(true);
    expect([...select.selectedOptions].map((o) => o.value)).toEqual(["urgent"]);

    select.options[1]!.selected = true;
    fireEvent.change(select);
    expect(ctrl.setDraft).toHaveBeenCalledExactlyOnceWith(
      formatMultiDraft(["urgent", "billable"])
    );
  });

  it("commits when the reader clicks away", () => {
    const ctrl = ctrlFor({
      editor: { type: "multi-select", options },
      selectOptions: options,
    });
    render(
      <NativeMultiSelectEditor
        ctrl={ctrl}
        label="Tags"
        onKeyDown={() => undefined}
      />
    );
    fireEvent.blur(document.querySelector("select")!);
    expect(ctrl.commitOnBlur).toHaveBeenCalledOnce();
  });

  it("hands the kit's keydown through, so Enter and Escape still work", () => {
    const onKeyDown = vi.fn();
    render(
      <NativeMultiSelectEditor
        ctrl={ctrlFor({
          editor: { type: "multi-select", options },
          selectOptions: options,
        })}
        label="Tags"
        onKeyDown={onKeyDown}
      />
    );
    fireEvent.keyDown(document.querySelector("select")!, { key: "Escape" });
    expect(onKeyDown).toHaveBeenCalledOnce();
  });
});
