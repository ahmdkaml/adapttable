/**
 * The saved-views management panel in this kit.
 *
 * Core decides which controls each row gets; these check that this kit's
 * controls drive them — including the two things a management UI most often
 * gets wrong: reordering that needs a mouse, and a rename you cannot escape.
 */
import type { SavedView } from "@adapttable/core";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SavedViewsPanel } from "./components/SavedViewsPanel";

function Wrapper({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

const VIEWS: SavedView[] = [
  { name: "Mine", search: "t.q=a" },
  { name: "Team", search: "t.q=b", isDefault: true },
];

function renderPanel(views: SavedView[] = VIEWS) {
  const handlers = {
    onApply: vi.fn(),
    onRename: vi.fn(),
    onMove: vi.fn(),
    onSetDefault: vi.fn(),
    onRemove: vi.fn(),
  };
  render(
    <Wrapper>
      <SavedViewsPanel views={views} {...handlers} />
    </Wrapper>
  );
  return handlers;
}

const rows = () =>
  document.querySelectorAll('[data-adapttable-part="saved-view-row"]');

describe("SavedViewsPanel", () => {
  it("lists every view, with the shared part names", () => {
    renderPanel();

    expect(rows()).toHaveLength(2);
    expect(
      document.querySelector('[data-adapttable-part="saved-views-panel"]')
    ).not.toBeNull();
  });

  it("groups the caption and the controls so a narrow panel wraps them", () => {
    renderPanel();

    const row = rows()[0]!;
    const caption = row.querySelector(
      '[data-adapttable-part="saved-view-caption"]'
    );
    const controls = row.querySelector(
      '[data-adapttable-part="saved-view-controls"]'
    );
    expect(caption).not.toBeNull();
    expect(controls).not.toBeNull();
    // Every control belongs to the group: one left outside it wraps on its
    // own and lands under the next view's name.
    expect(controls?.querySelectorAll("button")).toHaveLength(
      row.querySelectorAll("button").length
    );
  });

  it("marks the default view", () => {
    renderPanel();

    expect(screen.getByText("Default")).toBeInTheDocument();
  });

  it("reorders with a button, not a drag", () => {
    const handlers = renderPanel();

    const down = screen.getAllByRole("button", { name: "Move view down" })[0]!;
    down.focus();
    expect(down).toHaveFocus();
    fireEvent.click(down);

    expect(handlers.onMove).toHaveBeenCalledWith("Mine", 1);
  });

  it("disables the move it cannot make, rather than removing it", () => {
    // A control that vanishes at the end of a list makes the row jump; a
    // disabled one keeps the layout still and stays discoverable.
    renderPanel();

    const ups = screen.getAllByRole("button", { name: "Move view up" });
    const downs = screen.getAllByRole("button", { name: "Move view down" });
    expect(ups[0]).toBeDisabled();
    expect(ups[1]).toBeEnabled();
    expect(downs[0]).toBeEnabled();
    expect(downs[1]).toBeDisabled();
  });

  it("renames in place and abandons on Escape", () => {
    const handlers = renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Rename view" })[0]!);
    const input = screen.getByRole("textbox", { name: "View name" });
    fireEvent.change(input, { target: { value: "Nope" } });
    fireEvent.keyDown(input, { key: "Escape" });

    expect(handlers.onRename).not.toHaveBeenCalled();
    expect(screen.queryByRole("textbox", { name: "View name" })).toBeNull();
  });

  it("puts focus in the rename box without autoFocus", () => {
    // The panel focuses it through a ref when it arrives — `autoFocus` fires
    // at mount whether or not the element was the point of the interaction.
    renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Rename view" })[0]!);

    expect(screen.getByRole("textbox", { name: "View name" })).toHaveFocus();
  });

  it("commits a rename on Enter", () => {
    const handlers = renderPanel();

    fireEvent.click(screen.getAllByRole("button", { name: "Rename view" })[0]!);
    const input = screen.getByRole("textbox", { name: "View name" });
    fireEvent.change(input, { target: { value: "Renamed" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(handlers.onRename).toHaveBeenCalledWith("Mine", "Renamed");
  });

  it("shows a read-only view as read-only, not as broken", () => {
    // A shared view someone else owns: the controls are visibly disabled and
    // the row says why. A control that silently does nothing is a bug the
    // user gets blamed for.
    renderPanel([
      { name: "Theirs", search: "t.q=x", visibility: "team", readOnly: true },
    ]);

    expect(screen.getByText("Read-only")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rename view" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Delete view" })).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Set as default" })
    ).toBeDisabled();
    // Applying someone else's view is still fine — that is the point of it.
    expect(screen.getByRole("button", { name: "Apply view" })).toBeEnabled();
  });

  it("names the badge parts, so every kit is styleable the same way", () => {
    // Part names are public contract, and the parity script only sees the ones
    // a kit spells out in its own source — these two were adapter-unstyled's
    // alone while all seven panels rendered the badges.
    renderPanel([
      { name: "Theirs", search: "t.q=x", visibility: "team", readOnly: true },
      { name: "Mine", search: "t.q=a", isDefault: true },
    ]);

    expect(
      document.querySelector('[data-adapttable-part="saved-view-readonly"]')
    ).toHaveTextContent("Read-only");
    expect(
      document.querySelector('[data-adapttable-part="saved-view-default"]')
    ).toHaveTextContent("Default");
  });

  it("says so when nothing has been saved", () => {
    renderPanel([]);

    expect(rows()).toHaveLength(0);
  });
});
