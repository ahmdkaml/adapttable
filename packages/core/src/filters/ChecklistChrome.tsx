/**
 * Excel-style checklist layout. Structure only — adapters pass the
 * search field, action buttons and checkboxes the end user clicks.
 */
import { type ReactNode, type UIEvent, useState } from "react";

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

function windowSlice(
  items: readonly ChecklistValue[],
  scrollTop: number
): { start: number; slice: readonly ChecklistValue[] } {
  const start = Math.max(0, Math.floor(scrollTop / CHECKLIST_ITEM_HEIGHT) - 2);
  const count = Math.ceil(CHECKLIST_LIST_HEIGHT / CHECKLIST_ITEM_HEIGHT) + 4;
  return { start, slice: items.slice(start, start + count) };
}

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
  const [scrollTop, setScrollTop] = useState(0);
  if (!state.available) return null;
  const Search = slots.Search;
  const Button = slots.Button;
  const Checkbox = slots.Checkbox;

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
        style={
          state.virtualize
            ? {
                height: CHECKLIST_LIST_HEIGHT,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }
            : {
                maxHeight: CHECKLIST_LIST_HEIGHT,
                overflow: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 4,
              }
        }
        onScroll={state.virtualize ? onScroll : undefined}
      >
        {state.virtualize ? <div style={{ height: padTop }} /> : null}
        {windowed.slice.map((item) => (
          <Checkbox
            key={item.value}
            label={item.label}
            count={labels.groupCount(item.count)}
            checked={state.selected.includes(item.value)}
            className={classNames.filterCheckbox}
            countClassName={classNames.filterChecklistCount}
            onChange={(on) => state.toggle(item.value, on)}
          />
        ))}
        {state.virtualize ? <div style={{ height: padBottom }} /> : null}
        {state.visible.length === 0 ? (
          <span>{labels.checklistNoValues}</span>
        ) : null}
      </div>
    </div>
  );
}
