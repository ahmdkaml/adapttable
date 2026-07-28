import type { ComponentType, ReactElement, ReactNode } from "react";

import type { TableLabels } from "../types";
import type { SavedViewsMenuState } from "./savedViewsMenu";

/** The label strings a saved-views menu renders. */
export type SavedViewsLabels = Pick<
  Required<TableLabels>,
  "savedViews" | "saveView" | "viewName" | "deleteView"
>;

/**
 * The kit-supplied pieces the saved-views panel is assembled from. Each is a
 * component the adapter provides — Mantine hands over Mantine's, MUI over
 * MUI's — so the arrangement is written once while every pixel stays native.
 *
 * The panel and its trigger are NOT here: each kit's popover primitive owns
 * portalling, focus return and outside-click, and hand-rolling that is what
 * caused the historical z-index bugs.
 */
export interface SavedViewsParts {
  /** Wraps one saved view: its apply button beside its delete button. */
  Row: ComponentType<SavedViewsRowProps>;
  /** Applies the view whose name it renders. */
  ApplyButton: ComponentType<SavedViewsApplyButtonProps>;
  /** Deletes a view. Receives a fully composed accessible label. */
  DeleteButton: ComponentType<SavedViewsDeleteButtonProps>;
  /**
   * Separates the view list from the save row. A rendered node, not a
   * component — it takes no props and holds no state.
   */
  divider: ReactNode;
  /** Wraps the name field beside the save button. */
  SaveRow: ComponentType<SavedViewsRowProps>;
  /** The view-name text field. */
  NameInput: ComponentType<SavedViewsNameInputProps>;
  /** Commits the typed name. */
  SaveButton: ComponentType<SavedViewsSaveButtonProps>;
}

/** Props for the {@link SavedViewsParts.Row} and `SaveRow` wrappers. */
export interface SavedViewsRowProps {
  children: ReactNode;
}

/** Props for {@link SavedViewsParts.ApplyButton}. */
export interface SavedViewsApplyButtonProps {
  onClick: () => void;
  children: ReactNode;
}

/** Props for {@link SavedViewsParts.DeleteButton}. */
export interface SavedViewsDeleteButtonProps {
  /** A composed accessible label — "Delete view: Q1 report". */
  label: string;
  onClick: () => void;
}

/** Props for {@link SavedViewsParts.NameInput}. */
export interface SavedViewsNameInputProps {
  value: string;
  placeholder: string;
  /** Accessible label for the field. */
  label: string;
  onChange: (value: string) => void;
}

/** Props for {@link SavedViewsParts.SaveButton}. */
export interface SavedViewsSaveButtonProps {
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

/** Props for {@link SavedViewsMenuContent}. */
export interface SavedViewsMenuContentProps {
  /** Menu state from {@link useSavedViewsMenu}. */
  state: SavedViewsMenuState;
  /** Resolved label strings. */
  labels: SavedViewsLabels;
  /** The kit's components. */
  parts: SavedViewsParts;
}

/**
 * The inside of a saved-views panel: every captured view (click the name to
 * apply, the trailing control to delete), a divider, then a save row that
 * captures the table's CURRENT state under the typed name.
 *
 * Render it inside the kit's own popover. The trigger label
 * (`labels.savedViews`) belongs on that popover's trigger — the panel does
 * not repeat it.
 */
export function SavedViewsMenuContent({
  state,
  labels,
  parts,
}: Readonly<SavedViewsMenuContentProps>): ReactElement {
  const {
    Row,
    ApplyButton,
    DeleteButton,
    divider,
    SaveRow,
    NameInput,
    SaveButton,
  } = parts;
  return (
    <>
      {state.views.map((view) => (
        <Row key={view.name}>
          <ApplyButton onClick={() => state.applyView(view.name)}>
            {view.name}
          </ApplyButton>
          <DeleteButton
            label={`${labels.deleteView}: ${view.name}`}
            onClick={() => state.removeView(view.name)}
          />
        </Row>
      ))}
      {divider}
      <SaveRow>
        <NameInput
          value={state.name}
          placeholder={labels.viewName}
          label={labels.viewName}
          onChange={state.setName}
        />
        <SaveButton disabled={!state.canSave} onClick={state.saveView}>
          {labels.saveView}
        </SaveButton>
      </SaveRow>
    </>
  );
}
