/**
 * Managing saved views: the list, and what you can do to each one.
 *
 * The saved-views *menu* answers "switch to a view". This answers "keep the
 * list in order" — rename, reorder, delete, and choose the one the table
 * opens with. They are different jobs and putting both in a dropdown makes
 * the common one harder, so this is a panel rather than a deeper menu.
 *
 * Reordering is buttons, not drag, for the same reason the pivot panel's is:
 * a list you can only reorder by dragging is a list some people cannot
 * reorder. Renaming is an inline text input rather than a modal prompt — the
 * name is right there, and a dialog to change one word is a dialog too many.
 *
 * Structure, ordering, part names and labels live here. Every visible control
 * is a required slot the adapter fills with its own kit's component.
 */
import { type ReactNode, useState } from "react";

import { resolveLabels } from "../labels";
import type { TableLabels } from "../types";
import type { SavedView } from "./useSavedViews";

/** Props an adapter's panel surface receives. */
export interface SavedViewsPanelSurfaceProps {
  readonly children: ReactNode;
  readonly className?: string;
  /** Spread onto the surface — the public part name. */
  readonly "data-adapttable-part": "saved-views-panel";
}

/** Props an adapter's row receives — one saved view and its controls. */
export interface SavedViewsPanelRowProps {
  /** The view's name, or the rename input while it is being edited. */
  readonly name: ReactNode;
  /** Whether this is the view the table opens with. */
  readonly isDefault: boolean;
  /** The badge caption for the default view. */
  readonly defaultLabel: string;
  /** Apply it. */
  readonly onApply: () => void;
  /** Start renaming it. `undefined` while it is already being renamed. */
  readonly onRename?: () => void;
  /** Move it, or `undefined` at the end of the list it cannot leave. */
  readonly onMoveUp?: () => void;
  readonly onMoveDown?: () => void;
  /** Make it the default, or clear it when it already is. */
  readonly onSetDefault: () => void;
  /** Delete it. */
  readonly onRemove: () => void;
  /** Accessible names for the controls, already localized. */
  readonly applyLabel: string;
  readonly renameLabel: string;
  readonly moveUpLabel: string;
  readonly moveDownLabel: string;
  readonly setDefaultLabel: string;
  readonly removeLabel: string;
  /** Spread onto the row — the public part name. */
  readonly "data-adapttable-part": "saved-view-row";
}

/** Props an adapter's rename input receives. */
export interface SavedViewsPanelInputProps {
  /** Accessible name. */
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  /** Enter commits, Escape abandons — bind both. */
  readonly onCommit: () => void;
  readonly onCancel: () => void;
}

/** Props an adapter's empty state receives. */
export interface SavedViewsPanelEmptyProps {
  readonly message: string;
}

/** The kit-native pieces the panel is built from. */
export interface SavedViewsPanelSlots {
  /** The panel body. */
  readonly Surface: (props: SavedViewsPanelSurfaceProps) => ReactNode;
  /** One view. */
  readonly Row: (props: SavedViewsPanelRowProps) => ReactNode;
  /** The inline rename box. */
  readonly Input: (props: SavedViewsPanelInputProps) => ReactNode;
  /** Shown when nothing has been saved yet. */
  readonly Empty: (props: SavedViewsPanelEmptyProps) => ReactNode;
}

/** What the panel needs to render. */
export interface SavedViewsPanelChromeProps {
  /** The saved views, in list order. */
  views: readonly SavedView[];
  /** Apply one. */
  onApply: (name: string) => void;
  /** Rename one. */
  onRename: (from: string, to: string) => void;
  /** Move one a step. */
  onMove: (name: string, delta: -1 | 1) => void;
  /** Make one the default, or clear it. */
  onSetDefault: (name: string) => void;
  /** Delete one. */
  onRemove: (name: string) => void;
  /** Labels; falls back to the built-in English. */
  labels?: TableLabels;
  /** The kit's controls. */
  slots: SavedViewsPanelSlots;
  className?: string;
}

/**
 * The saved-views management panel.
 *
 * @param props - The views, the operations, and the adapter's slots.
 * @returns The panel, built from the adapter's own controls.
 */
export function SavedViewsPanelChrome({
  views,
  onApply,
  onRename,
  onMove,
  onSetDefault,
  onRemove,
  labels: labelsProp,
  slots,
  className,
}: Readonly<SavedViewsPanelChromeProps>) {
  const labels = resolveLabels(labelsProp);
  const { Surface, Row, Input, Empty } = slots;
  // Which view is being renamed, and the draft. Held here rather than by the
  // host: a half-typed name is the panel's business, not the table's.
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const commit = () => {
    if (editing !== null) onRename(editing, draft);
    setEditing(null);
  };

  return (
    <Surface className={className} data-adapttable-part="saved-views-panel">
      {views.length === 0 && <Empty message={labels.savedViews} />}
      {views.map((view, index) => (
        <Row
          key={view.name}
          data-adapttable-part="saved-view-row"
          isDefault={view.isDefault === true}
          defaultLabel={labels.defaultViewBadge}
          name={
            editing === view.name ? (
              <Input
                label={labels.viewName}
                value={draft}
                onChange={setDraft}
                onCommit={commit}
                onCancel={() => {
                  setEditing(null);
                }}
              />
            ) : (
              view.name
            )
          }
          onApply={() => {
            onApply(view.name);
          }}
          onRename={
            editing === view.name
              ? undefined
              : () => {
                  setEditing(view.name);
                  setDraft(view.name);
                }
          }
          onMoveUp={
            index > 0
              ? () => {
                  onMove(view.name, -1);
                }
              : undefined
          }
          onMoveDown={
            index < views.length - 1
              ? () => {
                  onMove(view.name, 1);
                }
              : undefined
          }
          onSetDefault={() => {
            onSetDefault(view.name);
          }}
          onRemove={() => {
            onRemove(view.name);
          }}
          applyLabel={labels.applyView}
          renameLabel={labels.renameView}
          moveUpLabel={labels.moveViewUp}
          moveDownLabel={labels.moveViewDown}
          setDefaultLabel={labels.setDefaultView}
          removeLabel={labels.deleteView}
        />
      ))}
    </Surface>
  );
}
