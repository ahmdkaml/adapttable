import {
  type FilterDef,
  filterLabel,
  filterOpLabel,
  type FilterValue,
  resolveLabels,
  type TableLabels,
  type TableSource,
  useFilterOptions,
  useRangeFilterWidget,
  useTextFilterWidget,
} from "@adapttable/core";
import { type ReactElement, type ReactNode } from "react";

import type { DataTableClassNames } from "../types";

/* Part names shared by more than one field shape. */
const FIELD_PART = "filter-field";
const LABEL_PART = "filter-label";

/** A filter-bag value as input text (`undefined` renders empty). */
function asText(value: FilterValue): string {
  return String(value ?? "");
}

/** A `multiSelect` bag value as an array, tolerating a scalar from the URL. */
function selectedValues(value: FilterValue): string[] {
  if (Array.isArray(value)) return value;
  if (value == null || value === "") return [];
  return [String(value)];
}

/** Props shared by every per-definition field component. */
interface DefFieldProps<TRow> {
  def: FilterDef<TRow>;
  source: TableSource<TRow>;
  classNames: DataTableClassNames;
}

interface GroupFieldProps {
  caption: string;
  classNames: DataTableClassNames;
  children: ReactNode;
}

/** `<fieldset>` + `<legend>` wrapper for multi-control fields. */
function GroupField({
  caption,
  classNames,
  children,
}: Readonly<GroupFieldProps>) {
  return (
    <fieldset
      data-adapttable-part={FIELD_PART}
      className={classNames.filterField}
    >
      <legend
        data-adapttable-part={LABEL_PART}
        className={classNames.filterLabel}
      >
        {caption}
      </legend>
      {children}
    </fieldset>
  );
}

function TextField<TRow>({
  def,
  source,
  classNames,
  labels,
}: Readonly<DefFieldProps<TRow> & { labels: Required<TableLabels> }>) {
  const { label, ops, opLabelKeys, op, value, needsValue, write } =
    useTextFilterWidget(def, source);
  return (
    <fieldset
      data-adapttable-part={FIELD_PART}
      className={classNames.filterField}
    >
      <legend
        data-adapttable-part={LABEL_PART}
        className={classNames.filterLabel}
      >
        {label}
      </legend>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select
          style={{ flex: "0 0 8.5rem", width: "8.5rem" }}
          aria-label={labels.operator}
          data-adapttable-part="filter-operator"
          className={classNames.filterOperator}
          value={op}
          onChange={(e) => {
            const next = ops.find((choice) => choice === e.currentTarget.value);
            if (next) write(next, value);
          }}
        >
          {ops.map((choice) => (
            <option key={choice} value={choice}>
              {filterOpLabel(labels, opLabelKeys[choice])}
            </option>
          ))}
        </select>
        {needsValue && (
          <input
            type="text"
            aria-label={label}
            placeholder={def.placeholder}
            data-adapttable-part="filter-input"
            className={classNames.filterInput}
            value={value}
            onChange={(e) => write(op, e.currentTarget.value)}
          />
        )}
      </div>
    </fieldset>
  );
}

function SelectField<TRow>({
  def,
  source,
  classNames,
}: Readonly<DefFieldProps<TRow>>) {
  // `def.options` may be a static array, an async loader, or a leftover
  // "auto" — never map it directly; the hook resolves all three shapes.
  const { options, loading } = useFilterOptions(def);
  return (
    <label data-adapttable-part={FIELD_PART} className={classNames.filterField}>
      <span
        data-adapttable-part={LABEL_PART}
        className={classNames.filterLabel}
      >
        {filterLabel(def)}
      </span>{" "}
      <select
        data-adapttable-part="filter-select"
        className={classNames.filterSelect}
        value={asText(source.extra[def.key])}
        onChange={(e) => source.setExtra(def.key, e.currentTarget.value)}
      >
        {loading ? (
          <option value="" disabled>
            …
          </option>
        ) : (
          <>
            <option value="">All</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </>
        )}
      </select>
    </label>
  );
}

function MultiSelectField<TRow>({
  def,
  source,
  classNames,
}: Readonly<DefFieldProps<TRow>>) {
  const selected = selectedValues(source.extra[def.key]);
  // Same contract as SelectField: the hook resolves arrays / loaders / "auto".
  const { options, loading } = useFilterOptions(def);
  return (
    <GroupField caption={filterLabel(def)} classNames={classNames}>
      <div
        data-adapttable-part="filter-checkbox-group"
        className={classNames.filterCheckboxGroup}
      >
        {loading ? (
          <span
            data-adapttable-part="filter-options-loading"
            className={classNames.filterOptionsLoading}
          >
            …
          </span>
        ) : (
          options.map((option) => (
            <label
              key={option.value}
              data-adapttable-part="filter-checkbox"
              className={classNames.filterCheckbox}
            >
              <input
                type="checkbox"
                checked={selected.includes(option.value)}
                onChange={(e) =>
                  source.setExtra(
                    def.key,
                    e.currentTarget.checked
                      ? [...selected, option.value]
                      : selected.filter((v) => v !== option.value)
                  )
                }
              />{" "}
              {option.label}
            </label>
          ))
        )}
      </div>
    </GroupField>
  );
}

interface RangeValueInputProps {
  type: "date" | "number" | "text";
  /** Placeholder AND accessible name (`Value`, `From`, or `To`). */
  label: string;
  value: string;
  onValue: (next: string) => void;
  classNames: DataTableClassNames;
}

/** One bound of a range widget; the parent owns the write-through. */
function RangeValueInput({
  type,
  label,
  value,
  onValue,
  classNames,
}: Readonly<RangeValueInputProps>) {
  return (
    <input
      type={type}
      style={{ flex: "1 1 7rem", minWidth: "7rem" }}
      placeholder={label}
      aria-label={label}
      data-adapttable-part="filter-input"
      className={classNames.filterInput}
      value={value}
      onChange={(e) => onValue(e.currentTarget.value)}
    />
  );
}

interface RangeFieldProps<TRow> extends DefFieldProps<TRow> {
  labels: Required<TableLabels>;
}

/**
 * Operator-first range field: a comparison `<select>` (its placeholder
 * option clears the pair), then ONE value input — or a labeled From/To
 * pair for `between`. The operator is persisted as `f_<key>Op`.
 */
function RangeField<TRow>({
  def,
  source,
  classNames,
  labels,
}: Readonly<RangeFieldProps<TRow>>) {
  const { label, ops, opLabelKeys, inputType, arity, op, setOp, a, b, write } =
    useRangeFilterWidget(def, source);
  const boundType = inputType === "text" ? "text" : inputType;
  return (
    <GroupField caption={label} classNames={classNames}>
      {/* Structural layout only (like the toolbar): the operator keeps a
          constant width; values fill the rest and wrap when they don't fit
          (date inputs have a wide native minimum). */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <select
          style={{ flex: "0 0 8.5rem", width: "8.5rem" }}
          aria-label={labels.operator}
          data-adapttable-part="filter-operator"
          className={classNames.filterOperator}
          value={op ?? ""}
          onChange={(e) => {
            // Find (not cast) the next operator; "" → undefined → clear.
            const next = ops.find((o) => o === e.currentTarget.value);
            setOp(next);
            write(next, a, b);
          }}
        >
          <option value="">{labels.operator}</option>
          {ops.map((o) => (
            <option key={o} value={o}>
              {filterOpLabel(
                labels,
                opLabelKeys[o as keyof typeof opLabelKeys]
              )}
            </option>
          ))}
        </select>
        {arity === "two" && (
          <>
            <RangeValueInput
              type={boundType}
              label={labels.from}
              value={a}
              onValue={(next) => write(op, next, b)}
              classNames={classNames}
            />
            <RangeValueInput
              type={boundType}
              label={labels.to}
              value={b}
              onValue={(next) => write(op, a, next)}
              classNames={classNames}
            />
          </>
        )}
        {op !== undefined && arity !== "none" && arity !== "two" && (
          <RangeValueInput
            type={boundType}
            label={labels.value}
            value={a}
            onValue={(next) => write(op, next, "")}
            classNames={classNames}
          />
        )}
      </div>
    </GroupField>
  );
}

interface FilterFieldProps<TRow> extends DefFieldProps<TRow> {
  labels: Required<TableLabels>;
}

function FilterField<TRow>({
  def,
  source,
  classNames,
  labels,
}: Readonly<FilterFieldProps<TRow>>): ReactElement {
  switch (def.type) {
    case "text":
      return (
        <TextField
          def={def}
          source={source}
          classNames={classNames}
          labels={labels}
        />
      );
    case "select":
      return <SelectField def={def} source={source} classNames={classNames} />;
    case "multiSelect":
      return (
        <MultiSelectField def={def} source={source} classNames={classNames} />
      );
    case "dateRange":
    case "numberRange":
      return (
        <RangeField
          def={def}
          source={source}
          classNames={classNames}
          labels={labels}
        />
      );
  }
}

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The resolved filter definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The table source whose filter bag the controls read and write. */
  source: TableSource<TRow>;
  /** Per-part class name overrides (the `filter*` keys). */
  classNames?: DataTableClassNames;
  /**
   * Label overrides for the range widgets (`operator`, `value`, `from`,
   * `to`, and the `op*` operator names); English defaults merge in.
   */
  labels?: TableLabels;
}

/**
 * The auto-built filter form for the declarative `filters` array: one
 * semantic field per definition (`text` input, `select` with an "All"
 * option, `multiSelect` checkbox list, operator-first `dateRange` /
 * `numberRange` widgets), each carrying `data-adapttable-part` hooks and
 * `classNames` overrides. Controls read `source.extra` and write through
 * `source.setExtra` / `source.setExtras` — an empty value clears its key.
 *
 * @typeParam TRow - The row type.
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
  classNames = {},
  labels,
}: Readonly<AutoFilterFormProps<TRow>>) {
  const resolvedLabels = resolveLabels(labels);
  return (
    <>
      {defs.map((def) => (
        <FilterField
          key={def.key}
          def={def}
          source={source}
          classNames={classNames}
          labels={resolvedLabels}
        />
      ))}
    </>
  );
}
