/**
 * The find bar.
 *
 * Deliberately kit-neutral: a native search input and two buttons, sized in
 * `em` so it inherits whatever type the table sits in. A find bar is one of the
 * few pieces of table chrome that is a browser convention rather than a design
 * system's — people expect Ctrl+F to produce something that behaves like the
 * browser's own — and eight kit-specific versions would be eight ways for it to
 * drift. Every part carries a `data-adapttable-part`, so a kit that wants its
 * own look styles it without a fork.
 */
import type { ChangeEvent, KeyboardEvent, ReactElement } from "react";

import { focusEditorOnMount } from "../editing/editableCellController";
import type { TableLabels } from "../types";
import type { FindInTableState } from "./useFindInTable";

/** Props for {@link FindBar}. */
export interface FindBarProps {
  /** The find state, straight from `shell.find`. */
  find: FindInTableState;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** A kit's own class for the bar. */
  className?: string;
}

const BUTTON: Record<string, string | number> = {
  border: "1px solid currentColor",
  borderRadius: "0.25em",
  background: "transparent",
  color: "inherit",
  cursor: "pointer",
  lineHeight: 1,
  padding: "0.25em 0.5em",
};

/**
 * Renders the find bar, or nothing when it is closed — so an adapter renders
 * it unconditionally and the opt-in promise still holds.
 *
 * Enter walks forward, Shift+Enter walks back and Escape closes, which is what
 * every find bar does and therefore what nobody should have to learn.
 */
export function FindBar({
  find,
  labels,
  className,
}: Readonly<FindBarProps>): ReactElement | null {
  if (!find.open) return null;
  const count = (labels?.findMatchCount ?? defaultCount)(
    find.index + 1,
    find.matches.length
  );
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      find.setOpen(false);
      return;
    }
    if (event.key !== "Enter") return;
    event.preventDefault();
    if (event.shiftKey) find.previous();
    else find.next();
  };

  return (
    <div
      data-adapttable-part="find-bar"
      className={className}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5em",
        padding: "0.25em 0",
      }}
    >
      <input
        // The bar exists only because the user just asked for it, so focus
        // belongs in the box they opened — the same mount-focus the cell
        // editors use, rather than an attribute a11y rules rightly distrust.
        ref={focusEditorOnMount}
        type="search"
        data-adapttable-part="find-input"
        aria-label={labels?.findInTable ?? "Find in table"}
        placeholder={labels?.findPlaceholder ?? "Find in table"}
        value={find.query}
        onChange={(event: ChangeEvent<HTMLInputElement>) => {
          find.setQuery(event.target.value);
        }}
        onKeyDown={onKeyDown}
        style={{ font: "inherit", padding: "0.25em 0.5em", minWidth: "12em" }}
      />
      <output data-adapttable-part="find-count">{count}</output>
      <button
        type="button"
        data-adapttable-part="find-previous"
        aria-label={labels?.findPrevious ?? "Previous match"}
        onClick={find.previous}
        disabled={find.matches.length === 0}
        style={BUTTON}
      >
        ↑
      </button>
      <button
        type="button"
        data-adapttable-part="find-next"
        aria-label={labels?.findNext ?? "Next match"}
        onClick={find.next}
        disabled={find.matches.length === 0}
        style={BUTTON}
      >
        ↓
      </button>
      <button
        type="button"
        data-adapttable-part="find-close"
        aria-label={labels?.findClose ?? "Close find"}
        onClick={() => {
          find.setOpen(false);
        }}
        style={BUTTON}
      >
        ✕
      </button>
    </div>
  );
}

/** "3 of 17", or "No matches" — replaceable through `labels.findMatchCount`. */
function defaultCount(current: number, total: number): string {
  return total === 0 ? "No matches" : `${current} of ${total}`;
}
