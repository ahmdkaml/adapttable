/**
 * The saved-views management panel.
 *
 * The slots are plain HTML: what is being tested is what core decides — which
 * controls exist on which row, what each one does, and that renaming can be
 * abandoned without changing anything.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  SavedViewsPanelChrome,
  type SavedViewsPanelSlots,
} from "./SavedViewsPanelChrome";
import type { SavedView } from "./useSavedViews";

const VIEWS: SavedView[] = [
  { name: "Mine", search: "t.q=a" },
  { name: "Team", search: "t.q=b", isDefault: true },
];

const slots: SavedViewsPanelSlots = {
  Surface: ({ children, ...rest }) => <div {...rest}>{children}</div>,
  Empty: ({ message }) => <p>{message}</p>,
  Input: ({ label, value, onChange, onCommit, onCancel }) => (
    <input
      aria-label={label}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") onCommit();
        if (event.key === "Escape") onCancel();
      }}
    />
  ),
  Row: ({
    name,
    isDefault,
    defaultLabel,
    onApply,
    onRename,
    onMoveUp,
    onMoveDown,
    onSetDefault,
    onRemove,
    applyLabel,
    renameLabel,
    moveUpLabel,
    moveDownLabel,
    setDefaultLabel,
    removeLabel,
    ...rest
  }) => (
    <div {...rest}>
      <span>{name}</span>
      {isDefault && <em>{defaultLabel}</em>}
      <button type="button" onClick={onApply}>
        {applyLabel}
      </button>
      {onRename && (
        <button type="button" onClick={onRename}>
          {renameLabel}
        </button>
      )}
      {onMoveUp && (
        <button type="button" onClick={onMoveUp}>
          {moveUpLabel}
        </button>
      )}
      {onMoveDown && (
        <button type="button" onClick={onMoveDown}>
          {moveDownLabel}
        </button>
      )}
      <button type="button" onClick={onSetDefault}>
        {setDefaultLabel}
      </button>
      <button type="button" onClick={onRemove}>
        {removeLabel}
      </button>
    </div>
  ),
};

function renderPanel(
  over: Partial<Parameters<typeof SavedViewsPanelChrome>[0]> = {}
) {
  const handlers = {
    onApply: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    onSetDefault: vi.fn(),
    onRemove: vi.fn(),
  };
  render(
    <SavedViewsPanelChrome
      views={VIEWS}
      slots={slots}
      {...handlers}
      {...over}
    />
  );
  return handlers;
}

describe("SavedViewsPanelChrome", () => {
  it("lists every view with its controls", () => {
    renderPanel();

    expect(
      document.querySelectorAll('[data-adapttable-part="saved-view-row"]')
    ).toHaveLength(2);
    expect(screen.getAllByRole("button", { name: "Apply view" })).toHaveLength(
      2
    );
  });

  it("marks the default view", () => {
    renderPanel();

    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("withholds the move controls at each end", () => {
    renderPanel();

    expect(
      screen.getAllByRole("button", { name: "Move view up" })
    ).toHaveLength(1);
    expect(
      screen.getAllByRole("button", { name: "Move view down" })
    ).toHaveLength(1);
  });

  it("reports apply, move, default and delete", () => {
    const handlers = renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Apply view" })[0]!);
    fireEvent.click(screen.getByRole("button", { name: "Move view down" }));
    fireEvent.click(
      screen.getAllByRole("button", { name: "Set as default" })[0]!
    );
    fireEvent.click(screen.getAllByRole("button", { name: "Delete view" })[0]!);

    expect(handlers.onApply).toHaveBeenCalledWith("Mine");
    expect(handlers.onMove).toHaveBeenCalledWith("Mine", 1);
    expect(handlers.onSetDefault).toHaveBeenCalledWith("Mine");
    expect(handlers.onRemove).toHaveBeenCalledWith("Mine");
  });

  it("renames in place, seeded with the current name", () => {
    const handlers = renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Rename view" })[0]!);
    const input = screen.getByRole("textbox", { name: "View name" });
    expect(input).toHaveValue("Mine");

    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handlers.onRename).toHaveBeenCalledWith("Mine", "Renamed");
  });

  it("abandons a rename on Escape without changing anything", () => {
    const handlers = renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Rename view" })[0]!);
    const input = screen.getByRole("textbox", { name: "View name" });
    fireEvent.change(input, { target: { value: "Nope" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(handlers.onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox")).toBeNull();
  });

  it("says so when nothing has been saved", () => {
    renderPanel({ views: [] });

    expect(
      document.querySelectorAll('[data-adapttable-part="saved-view-row"]')
    ).toHaveLength(0);
    expect(screen.getByText("Saved views")).toBeInTheDocument();
  });
});
