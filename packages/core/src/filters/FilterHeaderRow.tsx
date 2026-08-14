/**
 * Compact per-column filter row under the header. One native renderer
 * for every kit — the same defs and extra bag the panel uses (#282).
 */
import type { CSSProperties, ReactElement } from "react";

import type { ColumnDef } from "../types";
import type { TableLabels } from "../types";
import { ColumnSpacer } from "../virtual/ColumnSpacer";
import { defaultFilterRegistry } from "./filterBuiltins";
import { type FilterDef, filterLabel } from "./filterDefs";
import {
  type FilterFormSource,
  listFilterValues,
  useBooleanFilterWidget,
  useRangeFilterWidget,
  useTextFilterWidget,
} from "./filterForm";
import {
  type FilterTypeRegistry,
  renderRegisteredFilter,
} from "./filterRegistry";
import { useFilterOptions } from "./useFilterOptions";

/** Class hooks the unstyled adapter maps onto `DataTableClassNames`. */
export interface FilterHeaderClassNames {
  filterHeaderRow?: string;
  filterHeaderCell?: string;
  filterHeaderInput?: string;
  headerCell?: string;
  expandHeader?: string;
  reorderHeader?: string;
  selectionHeader?: string;
  actionsHeader?: string;
}

/** Overlay a sticky `top` on a cell or pad style. */
export function headerFilterStickTop(
  sticky: boolean,
  base: CSSProperties | undefined,
  top: number,
  stickyExtras?: CSSProperties
): CSSProperties | undefined {
  if (!sticky) return base;
  return { ...stickyExtras, ...base, top };
}

/** Props for {@link FilterHeaderRow}. */
export interface FilterHeaderRowProps<TRow> {
  /** When false the row does not render, even if defs exist. */
  readonly enabled?: boolean;
  readonly columns: readonly ColumnDef<TRow>[];
  readonly defs: readonly FilterDef<TRow>[];
  readonly source: FilterFormSource<TRow>;
  readonly registry?: FilterTypeRegistry;
  readonly labels: Required<TableLabels>;
  readonly expandable?: boolean;
  readonly showReorder?: boolean;
  readonly selection?: boolean;
  readonly showActions?: boolean;
  readonly columnSpacers?: { start: number; end: number };
  readonly cellStyle?: (column: ColumnDef<TRow>) => CSSProperties | undefined;
  readonly pinSide?: (key: string) => "start" | "end" | undefined;
  readonly padStyle?: CSSProperties;
  readonly stickyAttr?: true;
  readonly classNames?: FilterHeaderClassNames;
}

/** The definition that drives a column's header filter, if any. */
export function filterDefForColumn<TRow>(
  defs: readonly FilterDef<TRow>[],
  key: string
): FilterDef<TRow> | undefined {
  return defs.find((def) => (def.column ?? def.key) === key);
}

function Pad({
  part,
  style,
  stickyAttr,
  className,
}: Readonly<{
  part: string;
  style?: CSSProperties;
  stickyAttr?: true;
  className?: string;
}>): ReactElement {
  return (
    <th
      aria-hidden="true"
      data-adapttable-part={part}
      data-sticky={stickyAttr}
      style={style}
      className={className}
    />
  );
}

function TextCell<TRow>({
  def,
  source,
  labels,
  className,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
}>): ReactElement {
  const widget = useTextFilterWidget(def, source);
  return (
    <input
      type="search"
      value={widget.value}
      aria-label={widget.label}
      placeholder={labels.search}
      data-adapttable-part="filter-header-input"
      className={className}
      onChange={(event) => widget.write(widget.op, event.target.value)}
    />
  );
}

function SelectCell<TRow>({
  def,
  source,
  labels,
  multiple,
  className,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  multiple: boolean;
  className?: string;
}>): ReactElement {
  const { options } = useFilterOptions(def);
  const selected = listFilterValues(source.extra[def.key]);
  const write = (values: readonly string[]) => {
    source.setExtra(def.key, values.length > 0 ? [...values] : undefined);
  };
  return (
    <select
      aria-label={filterLabel(def)}
      multiple={multiple}
      value={multiple ? selected : (selected[0] ?? "")}
      data-adapttable-part="filter-header-input"
      className={className}
      onChange={(event) => {
        if (!multiple) {
          write(event.target.value === "" ? [] : [event.target.value]);
          return;
        }
        write([...event.target.selectedOptions].map((option) => option.value));
      }}
    >
      {multiple ? null : <option value="">{labels.boolAny}</option>}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function BooleanCell<TRow>({
  def,
  source,
  labels,
  className,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
}>): ReactElement {
  const widget = useBooleanFilterWidget(def, source);
  return (
    <select
      aria-label={widget.label}
      value={widget.choice}
      data-adapttable-part="filter-header-input"
      className={className}
      onChange={(event) =>
        widget.write(event.target.value as typeof widget.choice)
      }
    >
      <option value="">{labels.boolAny}</option>
      <option value="true">{labels.boolTrue}</option>
      <option value="false">{labels.boolFalse}</option>
    </select>
  );
}

function RangeCell<TRow>({
  def,
  source,
  className,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  className?: string;
}>): ReactElement {
  const widget = useRangeFilterWidget(def, source);
  // Compact header has no operator picker. An unset op would wipe the
  // value on write; `gte` is the same inference a lone lower bound uses.
  const op = widget.op ?? "gte";
  return (
    <span data-adapttable-part="filter-header-input" className={className}>
      <input
        type={widget.inputType}
        value={widget.a}
        aria-label={widget.label}
        onChange={(event) => widget.write(op, event.target.value, widget.b)}
      />
      {widget.arity === "two" ? (
        <input
          type={widget.inputType}
          value={widget.b}
          aria-label={widget.label}
          onChange={(event) => widget.write(op, widget.a, event.target.value)}
        />
      ) : null}
    </span>
  );
}

/** Compact control for one filter definition — used in the header row and antd titles. */
export function FilterHeaderControl<TRow>({
  def,
  source,
  labels,
  className,
  registry = defaultFilterRegistry,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
  registry?: FilterTypeRegistry;
}>): ReactElement {
  return (
    <FilterHeaderCell
      def={def}
      source={source}
      labels={labels}
      className={className}
      registry={registry}
    />
  );
}

function FilterHeaderCell<TRow>({
  def,
  source,
  labels,
  className,
  registry = defaultFilterRegistry,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  className?: string;
  registry?: FilterTypeRegistry;
}>): ReactElement | null {
  const spec = registry.get(def.type);
  const custom = renderRegisteredFilter(
    def,
    source,
    labels,
    registry,
    className
  );
  if (custom) return custom;
  switch (spec?.widget ?? def.type) {
    case "text":
      return (
        <TextCell
          def={def}
          source={source}
          labels={labels}
          className={className}
        />
      );
    case "select":
      return (
        <SelectCell
          def={def}
          source={source}
          labels={labels}
          multiple={false}
          className={className}
        />
      );
    case "multiSelect":
    case "checklist":
      return (
        <SelectCell
          def={def}
          source={source}
          labels={labels}
          multiple
          className={className}
        />
      );
    case "boolean":
      return (
        <BooleanCell
          def={def}
          source={source}
          labels={labels}
          className={className}
        />
      );
    case "numberRange":
    case "dateRange":
      return <RangeCell def={def} source={source} className={className} />;
    default:
      return null;
  }
}

/**
 * Second header row of per-column quick filters. Pads and spacers match
 * the leaf header so sticky, pin offsets, and column windowing stay aligned.
 */
export function FilterHeaderRow<TRow>({
  enabled = true,
  columns,
  defs,
  source,
  labels,
  expandable = false,
  showReorder = false,
  selection = false,
  showActions = false,
  columnSpacers,
  cellStyle,
  pinSide,
  padStyle,
  stickyAttr,
  classNames = {},
  registry = defaultFilterRegistry,
}: Readonly<FilterHeaderRowProps<TRow>>): ReactElement | null {
  if (!enabled || defs.length === 0) return null;
  const pad = (part: string, extra?: string) => (
    <Pad
      part={part}
      style={padStyle}
      stickyAttr={stickyAttr}
      className={[classNames.headerCell, extra].filter(Boolean).join(" ")}
    />
  );
  return (
    <tr
      data-adapttable-part="filter-header-row"
      className={classNames.filterHeaderRow}
      aria-label={labels.headerFilters}
    >
      {expandable ? pad("expand-header", classNames.expandHeader) : null}
      {showReorder ? pad("reorder-header", classNames.reorderHeader) : null}
      {selection ? pad("selection-header", classNames.selectionHeader) : null}
      {columnSpacers ? (
        <ColumnSpacer width={columnSpacers.start} side="start" as="th" />
      ) : null}
      {columns.map((column) => {
        const def = filterDefForColumn(defs, column.key);
        return (
          <th
            key={column.key}
            data-adapttable-part="filter-header-cell"
            data-sticky={stickyAttr}
            data-pinned={pinSide?.(column.key)}
            data-column-key={column.key}
            style={cellStyle?.(column)}
            className={
              [classNames.headerCell, classNames.filterHeaderCell]
                .filter(Boolean)
                .join(" ") || undefined
            }
          >
            {def ? (
              <FilterHeaderCell
                def={def}
                source={source}
                labels={labels}
                className={classNames.filterHeaderInput}
                registry={registry}
              />
            ) : null}
          </th>
        );
      })}
      {columnSpacers ? (
        <ColumnSpacer width={columnSpacers.end} side="end" as="th" />
      ) : null}
      {showActions ? pad("actions-header", classNames.actionsHeader) : null}
    </tr>
  );
}
