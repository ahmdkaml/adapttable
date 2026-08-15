/**
 * Compact checklist layout. Structure only — adapters pass the search
 * field, action buttons and checkboxes the end user clicks. Options wrap
 * like the multi-select form; they never stack one value per row.
 */
import { type CSSProperties, type ReactNode } from "react";

import { resolveLabels } from "../labels";
import type { TableSource } from "../source/TableSource";
import type { TableLabels } from "../types";
import { CHECKLIST_LIST_HEIGHT, useChecklistFilter } from "./checklist";
import { type FilterDef, filterLabel } from "./filterDefs";

/** Class hooks the unstyled adapter maps onto `DataTableClassNames`. */
export interface ChecklistClassNames {
  filterChecklist?: string;
  filterChecklistSearch?: string;
  filterChecklistActions?: string;
  filterChecklistList?: string;
  filterChecklistCount?: string;
  filterField?: string;
  filterLabel?: string;
  filterInput?: string;
  filterCheckboxGroup?: string;
  filterCheckbox?: string;
}

/** Props for an adapter {@link ChecklistFilter} — no slots on the public API. */
export interface ChecklistFilterProps<TRow> {
  readonly def: FilterDef<TRow>;
  readonly source: Pick<
    TableSource<TRow>,
    "allFilteredRows" | "extra" | "setExtra" | "facets"
  >;
  readonly labels?: TableLabels;
  readonly classNames?: ChecklistClassNames;
}

/** Kit search field the checklist layout calls. */
export interface ChecklistSearchProps {
  readonly label: string;
  readonly value: string;
  readonly className?: string;
  readonly onChange: (value: string) => void;
}

/** Kit button the checklist layout calls. */
export interface ChecklistButtonProps {
  readonly label: string;
  readonly onClick: () => void;
}

/** Kit checkbox row the checklist layout calls. */
export interface ChecklistCheckboxProps {
  readonly label: string;
  readonly count: string;
  readonly checked: boolean;
  readonly className?: string;
  readonly countClassName?: string;
  readonly onChange: (checked: boolean) => void;
}

/** Adapter-supplied controls for {@link ChecklistChrome}. */
export interface ChecklistSlots {
  readonly Search: (props: ChecklistSearchProps) => ReactNode;
  readonly Button: (props: ChecklistButtonProps) => ReactNode;
  readonly Checkbox: (props: ChecklistCheckboxProps) => ReactNode;
}

/** Props for {@link ChecklistChrome}. */
export interface ChecklistChromeProps<TRow> extends ChecklistFilterProps<TRow> {
  readonly slots: ChecklistSlots;
}

const LIST: CSSProperties = {
  maxHeight: CHECKLIST_LIST_HEIGHT,
  overflow: "auto",
  display: "flex",
  flexWrap: "wrap",
  alignItems: "center",
  gap: 8,
};

const OPTION: CSSProperties = {
  flex: "0 0 auto",
  display: "inline-flex",
  alignItems: "center",
  maxWidth: "100%",
};

/**
 * Distinct-values checklist layout. Returns `null` when the source has no
 * `allFilteredRows` and no facets — a server page must declare facets
 * before this widget can count a set it does not hold.
 */
export function ChecklistChrome<TRow>({
  def,
  source,
  labels: labelOverrides,
  classNames = {},
  slots,
}: Readonly<ChecklistChromeProps<TRow>>) {
  const labels = resolveLabels(labelOverrides);
  const state = useChecklistFilter(def, source);
  if (!state.available) return null;
  const Search = slots.Search;
  const Button = slots.Button;
  const Checkbox = slots.Checkbox;

  return (
    <div
      data-adapttable-part="filter-checklist"
      className={classNames.filterChecklist ?? classNames.filterField}
      style={{ display: "flex", flexDirection: "column", gap: 8, minWidth: 0 }}
    >
      <div
        data-adapttable-part="filter-label"
        className={classNames.filterLabel}
      >
        {filterLabel(def)}
      </div>
      <Search
        label={labels.checklistSearch}
        value={state.query}
        className={classNames.filterChecklistSearch ?? classNames.filterInput}
        onChange={state.setQuery}
      />
      <div
        data-adapttable-part="filter-checklist-actions"
        className={classNames.filterChecklistActions}
        style={{ display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        <Button label={labels.selectAll} onClick={state.selectAllVisible} />
        <Button label={labels.checklistClear} onClick={state.clear} />
      </div>
      <div
        data-adapttable-part="filter-checklist-list"
        data-virtualized={state.virtualize ? "true" : "false"}
        className={
          classNames.filterChecklistList ?? classNames.filterCheckboxGroup
        }
        style={LIST}
      >
        {state.visible.map((item) => (
          <div key={item.value} style={OPTION}>
            <Checkbox
              label={item.label}
              count={labels.groupCount(item.count)}
              checked={state.selected.includes(item.value)}
              className={classNames.filterCheckbox}
              countClassName={classNames.filterChecklistCount}
              onChange={(on) => state.toggle(item.value, on)}
            />
          </div>
        ))}
        {state.visible.length === 0 ? (
          <span>{labels.checklistNoValues}</span>
        ) : null}
      </div>
    </div>
  );
}
