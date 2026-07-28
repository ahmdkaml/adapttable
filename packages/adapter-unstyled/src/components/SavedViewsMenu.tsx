import type { UseSavedViewsOptions } from "@adapttable/core";
import {
  type SavedViewsApplyButtonProps,
  type SavedViewsDeleteButtonProps,
  type SavedViewsLabels,
  SavedViewsMenuContent,
  type SavedViewsNameInputProps,
  type SavedViewsParts,
  type SavedViewsRowProps,
  type SavedViewsSaveButtonProps,
  useSavedViewsMenu,
} from "@adapttable/core/adapter";
import type { CSSProperties } from "react";
import { useMemo } from "react";

import type { DataTableClassNames } from "../types";
import { MENU_PANEL_STYLE, useMenuPopover } from "./menuPopover";

export type { SavedViewsLabels };

/**
 * Layout for a panel row: the name/input takes the space, the trailing
 * button keeps its size. The gap is structural — without it the two sit
 * flush, and no class hook can add space a consumer has not asked for.
 */
const ROW_STYLE: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
};

export interface SavedViewsMenuProps {
  /** Wiring for core's `useSavedViews` — storage key, storage, adapter, urlKey. */
  options: UseSavedViewsOptions;
  labels: SavedViewsLabels;
  classNames: DataTableClassNames;
}

/**
 * Saved-views popover: a disclosure button + a panel listing the saved views
 * (click applies one and closes; each has a delete button) above a save row
 * that captures the table's CURRENT state under a typed name. Arrangement and
 * behaviour come from core's shared menu; this adapter supplies plain elements
 * carrying the `data-adapttable-part` hooks and `classNames` slots. Ships no
 * styles — closes on outside-click or Escape.
 */
export function SavedViewsMenu({
  options,
  labels,
  classNames,
}: Readonly<SavedViewsMenuProps>) {
  const { open, setOpen, rootRef, triggerRef } = useMenuPopover();
  const state = useSavedViewsMenu({
    ...options,
    onRequestClose: () => setOpen(false),
  });

  // Plain-element parts. Memoised so the shared content does not see a new
  // component identity — and remount every node — on each keystroke.
  const parts = useMemo<SavedViewsParts>(
    () => ({
      Row: ({ children }: SavedViewsRowProps) => (
        <div
          data-adapttable-part="views-row"
          className={classNames.viewsRow}
          style={ROW_STYLE}
        >
          {children}
        </div>
      ),
      ApplyButton: ({ onClick, children }: SavedViewsApplyButtonProps) => (
        <button
          type="button"
          data-adapttable-part="views-item"
          className={classNames.viewsItem}
          onClick={onClick}
        >
          {children}
        </button>
      ),
      DeleteButton: ({ label, onClick }: SavedViewsDeleteButtonProps) => (
        <button
          type="button"
          aria-label={label}
          data-adapttable-part="views-delete"
          className={classNames.viewsDelete}
          onClick={onClick}
        >
          ×
        </button>
      ),
      divider: (
        <hr
          data-adapttable-part="views-divider"
          className={classNames.viewsDivider}
        />
      ),
      SaveRow: ({ children }: SavedViewsRowProps) => (
        <div
          data-adapttable-part="views-save-row"
          className={classNames.viewsSaveRow}
          style={ROW_STYLE}
        >
          {children}
        </div>
      ),
      NameInput: ({
        value,
        placeholder,
        label,
        onChange,
      }: SavedViewsNameInputProps) => (
        <input
          aria-label={label}
          placeholder={placeholder}
          data-adapttable-part="views-input"
          className={classNames.viewsInput}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
        />
      ),
      SaveButton: ({
        disabled,
        onClick,
        children,
      }: SavedViewsSaveButtonProps) => (
        <button
          type="button"
          disabled={disabled}
          data-adapttable-part="views-save"
          className={classNames.viewsSave}
          onClick={onClick}
        >
          {children}
        </button>
      ),
    }),
    [classNames]
  );

  return (
    <div
      ref={rootRef}
      data-adapttable-part="views-menu"
      className={classNames.viewsMenu}
      style={{ position: "relative" }}
    >
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="true"
        data-adapttable-part="views-button"
        data-active={open || undefined}
        className={classNames.viewsButton}
        style={{ flexShrink: 0, whiteSpace: "nowrap" }}
        onClick={() => setOpen((v) => !v)}
      >
        {labels.savedViews}
      </button>
      {open && (
        <div
          data-adapttable-part="views-panel"
          className={classNames.viewsPanel}
          style={MENU_PANEL_STYLE}
        >
          <SavedViewsMenuContent state={state} labels={labels} parts={parts} />
        </div>
      )}
    </div>
  );
}
