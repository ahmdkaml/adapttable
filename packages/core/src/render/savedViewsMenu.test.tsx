import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useSavedViewsMenu } from "./savedViewsMenu";
import type {
  SavedViewsLabels,
  SavedViewsParts,
} from "./SavedViewsMenuContent";
import { SavedViewsMenuContent } from "./SavedViewsMenuContent";

const LABELS: SavedViewsLabels = {
  savedViews: "Saved views",
  saveView: "Save view",
  viewName: "View name",
  deleteView: "Delete view",
};

/** Minimal plain-DOM parts — the same contract an adapter fulfils. */
const PARTS: SavedViewsParts = {
  Row: ({ children }) => <div data-testid="row">{children}</div>,
  ApplyButton: ({ onClick, children }) => (
    <button type="button" onClick={onClick}>
      {children}
    </button>
  ),
  DeleteButton: ({ label, onClick }) => (
    <button type="button" aria-label={label} onClick={onClick}>
      ×
    </button>
  ),
  divider: <hr data-testid="divider" />,
  SaveRow: ({ children }) => <div data-testid="save-row">{children}</div>,
  NameInput: ({ value, placeholder, label, onChange }) => (
    <input
      aria-label={label}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.currentTarget.value)}
    />
  ),
  SaveButton: ({ disabled, onClick, children }) => (
    <button type="button" disabled={disabled} onClick={onClick}>
      {children}
    </button>
  ),
};

function Harness({
  onRequestClose,
  storageKey = "views-test",
}: Readonly<{ onRequestClose?: () => void; storageKey?: string }>) {
  const state = useSavedViewsMenu({ storageKey, urlKey: "t", onRequestClose });
  return <SavedViewsMenuContent state={state} labels={LABELS} parts={PARTS} />;
}

describe("useSavedViewsMenu + SavedViewsMenuContent", () => {
  it("saves the current state under a name, then clears the field", () => {
    window.localStorage.clear();
    render(<Harness />);

    const field = screen.getByLabelText("View name");
    fireEvent.change(field, { target: { value: "Q1" } });
    fireEvent.click(screen.getByText("Save view"));

    expect(screen.getByText("Q1")).toBeTruthy();
    expect((field as HTMLInputElement).value).toBe("");
  });

  it("refuses a blank or whitespace-only name", () => {
    window.localStorage.clear();
    render(<Harness />);

    const save = screen.getByText<HTMLButtonElement>("Save view");
    expect(save.disabled).toBe(true);

    // Whitespace does not count as a name, and clicking anyway saves nothing.
    fireEvent.change(screen.getByLabelText("View name"), {
      target: { value: "   " },
    });
    expect(save.disabled).toBe(true);
    fireEvent.click(save);
    expect(screen.queryAllByTestId("row")).toHaveLength(0);
  });

  it("asks the host to close when a view is applied", () => {
    window.localStorage.clear();
    const onRequestClose = vi.fn();
    render(<Harness onRequestClose={onRequestClose} />);

    fireEvent.change(screen.getByLabelText("View name"), {
      target: { value: "Q1" },
    });
    fireEvent.click(screen.getByText("Save view"));
    fireEvent.click(screen.getByText("Q1"));

    expect(onRequestClose).toHaveBeenCalledTimes(1);
  });

  it("applies without a close handler wired", () => {
    window.localStorage.clear();
    render(<Harness />);

    fireEvent.change(screen.getByLabelText("View name"), {
      target: { value: "Q1" },
    });
    fireEvent.click(screen.getByText("Save view"));
    expect(() => fireEvent.click(screen.getByText("Q1"))).not.toThrow();
  });

  it("deletes a view and leaves the panel open", () => {
    window.localStorage.clear();
    const onRequestClose = vi.fn();
    render(<Harness onRequestClose={onRequestClose} />);

    fireEvent.change(screen.getByLabelText("View name"), {
      target: { value: "Q1" },
    });
    fireEvent.click(screen.getByText("Save view"));
    fireEvent.click(screen.getByLabelText("Delete view: Q1"));

    expect(screen.queryByText("Q1")).toBeNull();
    expect(onRequestClose).not.toHaveBeenCalled();
  });

  it("renders the divider and the save row even with no views", () => {
    window.localStorage.clear();
    render(<Harness />);

    expect(screen.getByTestId("divider")).toBeTruthy();
    expect(screen.getByTestId("save-row")).toBeTruthy();
    expect(screen.queryAllByTestId("row")).toHaveLength(0);
  });
});
