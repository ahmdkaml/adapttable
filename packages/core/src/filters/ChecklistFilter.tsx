/**
 * Native Excel-style checklist. One renderer for every kit — kit Select
 * portals fight the filter popover, the same reason the tree builder
 * stayed on native controls.
 */
import { type ChangeEvent, type UIEvent, useState } from "react";

import { resolveLabels } from "../labels";
import type { TableSource } from "../source/TableSource";
import type { TableLabels } from "../types";
import {
  CHECKLIST_ITEM_HEIGHT,
  CHECKLIST_LIST_HEIGHT,
  type ChecklistValue,
  useChecklistFilter,
} from "./checklist";
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

/** Props for {@link ChecklistFilter}. */
export interface ChecklistFilterProps<TRow> {
  readonly def: FilterDef<TRow>;
  readonly source: Pick<
    TableSource<TRow>,
    "allFilteredRows" | "extra" | "setExtra" | "facets"
  >;
  readonly labels?: TableLabels;
  readonly classNames?: ChecklistClassNames;
}

function windowSlice(
  items: readonly ChecklistValue[],
  scrollTop: number
): { start: number; slice: readonly ChecklistValue[] } {
  const start = Math.max(0, Math.floor(scrollTop / CHECKLIST_ITEM_HEIGHT) - 2);
  const count = Math.ceil(CHECKLIST_LIST_HEIGHT / CHECKLIST_ITEM_HEIGHT) + 4;
  return { start, slice: items.slice(start, start + count) };
}

/**
 * Distinct-values checklist. Returns `null` when the source has no
 * `allFilteredRows` — a server page must declare facets (#281) before
 * this widget can count a set it does not hold.
 */
export function ChecklistFilter<TRow>({
  def,
  source,
  labels: labelOverrides,
  classNames = {},
}: Readonly<ChecklistFilterProps<TRow>>) {
  const labels = resolveLabels(labelOverrides);
  const state = useChecklistFilter(def, source);
  const [scrollTop, setScrollTop] = useState(0);
  if (!state.available) return null;

  const onScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };
  const windowed = state.virtualize
    ? windowSlice(state.visible, scrollTop)
    : { start: 0, slice: state.visible };
  const padTop = windowed.start * CHECKLIST_ITEM_HEIGHT;
  const padBottom = state.virtualize
    ? Math.max(
        0,
        (state.visible.length - windowed.start - windowed.slice.length) *
          CHECKLIST_ITEM_HEIGHT
      )
    : 0;

  return (
    <fieldset
      data-adapttable-part="filter-checklist"
      className={classNames.filterChecklist ?? classNames.filterField}
    >
      <legend
        data-adapttable-part="filter-label"
        className={classNames.filterLabel}
      >
        {filterLabel(def)}
      </legend>
      <input
        type="search"
        aria-label={labels.checklistSearch}
        placeholder={labels.checklistSearch}
        data-adapttable-part="filter-checklist-search"
        className={classNames.filterChecklistSearch ?? classNames.filterInput}
        value={state.query}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          state.setQuery(event.target.value)
        }
      />
      <div
        data-adapttable-part="filter-checklist-actions"
        className={classNames.filterChecklistActions}
      >
        <button type="button" onClick={state.selectAllVisible}>
          {labels.selectAll}
        </button>
        <button type="button" onClick={state.clear}>
          {labels.checklistClear}
        </button>
      </div>
      <div
        data-adapttable-part="filter-checklist-list"
        data-virtualized={state.virtualize ? "true" : "false"}
        className={
          classNames.filterChecklistList ?? classNames.filterCheckboxGroup
        }
        style={
          state.virtualize
            ? { height: CHECKLIST_LIST_HEIGHT, overflow: "auto" }
            : { maxHeight: CHECKLIST_LIST_HEIGHT, overflow: "auto" }
        }
        onScroll={state.virtualize ? onScroll : undefined}
      >
        {state.virtualize ? <div style={{ height: padTop }} /> : null}
        {windowed.slice.map((item) => {
          const checked = state.selected.includes(item.value);
          const countText = labels.groupCount(item.count);
          return (
            <label
              key={item.value}
              data-adapttable-part="filter-checkbox"
              className={classNames.filterCheckbox}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(event: ChangeEvent<HTMLInputElement>) =>
                  state.toggle(item.value, event.target.checked)
                }
              />{" "}
              {item.label}{" "}
              <span
                data-adapttable-part="filter-checklist-count"
                className={classNames.filterChecklistCount}
              >
                {countText}
              </span>
            </label>
          );
        })}
        {state.virtualize ? <div style={{ height: padBottom }} /> : null}
        {state.visible.length === 0 ? (
          <span>{labels.checklistNoValues}</span>
        ) : null}
      </div>
    </fieldset>
  );
}
