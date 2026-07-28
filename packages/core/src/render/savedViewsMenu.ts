import { useCallback, useState } from "react";

import type { SavedView } from "../url/useSavedViews";
import { useSavedViews, type UseSavedViewsOptions } from "../url/useSavedViews";

/**
 * The saved-views menu's own state, independent of any UI kit: the view
 * list, the pending name, and the three actions a menu offers.
 *
 * Every adapter drove this itself, and they drifted — some closed the panel
 * on apply, some did not. Behaviour lives here now; the adapters supply the
 * popover and the primitives.
 */
export interface SavedViewsMenuState {
  /** The saved views, in save order. */
  views: readonly SavedView[];
  /** Current text in the name field. */
  name: string;
  /** Update the name field. */
  setName: (value: string) => void;
  /** Whether the typed name is non-blank, so saving is allowed. */
  canSave: boolean;
  /**
   * Apply a view, then ask the host to close. Applying is terminal — the
   * user picked what they wanted, so the panel gets out of the way.
   */
  applyView: (name: string) => void;
  /** Delete a view. The panel stays open — deleting is not a choice of view. */
  removeView: (name: string) => void;
  /**
   * Capture the current table state under the typed name and clear the
   * field, keeping the panel open so several views can be captured in one
   * sitting. A no-op while {@link canSave} is false.
   */
  saveView: () => void;
}

/** Options for {@link useSavedViewsMenu}. */
export interface UseSavedViewsMenuOptions extends UseSavedViewsOptions {
  /**
   * Called when the menu should close — after a view is applied. The open
   * state itself belongs to the adapter, because each kit's popover owns it
   * (a compound `Popover.Target`, an `anchorEl`, a plain boolean…).
   */
  onRequestClose?: () => void;
}

/**
 * Headless saved-views MENU: {@link useSavedViews} plus the name field and
 * the apply/save/delete behaviour every adapter's menu repeats. Pair it with
 * the kit's own popover and primitives.
 */
export function useSavedViewsMenu({
  onRequestClose,
  ...options
}: UseSavedViewsMenuOptions): SavedViewsMenuState {
  const { views, save, apply, remove } = useSavedViews(options);
  const [name, setName] = useState("");
  const trimmed = name.trim();

  const applyView = useCallback(
    (viewName: string) => {
      apply(viewName);
      onRequestClose?.();
    },
    [apply, onRequestClose]
  );

  const saveView = useCallback(() => {
    if (trimmed === "") return;
    save(trimmed);
    setName("");
  }, [save, trimmed]);

  return {
    views,
    name,
    setName,
    canSave: trimmed !== "",
    applyView,
    removeView: remove,
    saveView,
  };
}
