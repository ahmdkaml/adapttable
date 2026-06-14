import type { CSSProperties, Dispatch, RefObject, SetStateAction } from "react";
import { useEffect, useRef, useState } from "react";

/**
 * Inline style for an absolutely-positioned toolbar menu panel. The extra
 * `margin`/`border`/`padding`/`minInlineSize` zeros neutralise `<fieldset>`
 * defaults so the same style works for any panel element.
 */
export const MENU_PANEL_STYLE: CSSProperties = {
  position: "absolute",
  zIndex: 200,
  insetInlineEnd: 0,
  margin: 0,
  border: 0,
  padding: 0,
  minInlineSize: 0,
};

/** Disclosure state shared by the toolbar menu popovers. */
export interface MenuPopoverState {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  /** Attach to the wrapper — pointer-downs inside it do not close the panel. */
  rootRef: RefObject<HTMLDivElement | null>;
  /** Attach to the trigger — Escape hands keyboard focus back to it. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}

/**
 * Disclosure behaviour for the toolbar menus (ColumnMenu, SavedViewsMenu):
 * open/close state that also closes on outside mousedown or Escape, with
 * Escape restoring focus to the trigger.
 */
export function useMenuPopover(): MenuPopoverState {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      // Escape strands keyboard focus inside the removed panel — hand it
      // back to the trigger (outside clicks keep their own focus target).
      triggerRef.current?.focus();
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return { open, setOpen, rootRef, triggerRef };
}
