import {
  type FilterDef,
  filterLabel,
  type FilterValue,
  RANGE_OP_LABEL_KEYS,
  RANGE_OPS,
  RANGE_SUFFIXES,
  type RangeOp,
  readRangeWidget,
  resolveLabels,
  type TableLabels,
  type TableSource,
  useFilterOptions,
  writeRangeWidget,
} from "@adapttable/core";
import { type ReactElement, type ReactNode, useState } from "react";

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

interface BagInputProps<TRow> {
  source: TableSource<TRow>;
  stateKey: string;
  type: "text" | "date" | "number";
  placeholder?: string;
  classNames: DataTableClassNames;
}

/** One input bound to a filter-bag state key (empty text clears it). */
function BagInput<TRow>({
  source,
  stateKey,
  type,
  placeholder,
  classNames,
}: Readonly<BagInputProps<TRow>>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      data-adapttable-part="filter-input"
      className={classNames.filterInput}
      value={asText(source.extra[stateKey])}
      onChange={(e) => source.setExtra(stateKey, e.currentTarget.value)}
    />
  );
}

function TextField<TRow>({
  def,
  source,
  classNames,
}: Readonly<DefFieldProps<TRow>>) {
  return (
    <label data-adapttable-part={FIELD_PART} className={classNames.filterField}>
      <span
        data-adapttable-part={LABEL_PART}
        className={classNames.filterLabel}
      >
        {filterLabel(def)}
      </span>{" "}
      <BagInput
        source={source}
        stateKey={def.key}
        type="text"
        placeholder={def.placeholder}
        classNames={classNames}
      />
    </label>
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
  type: "date" | "number";
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
  /** Input type AND the `RANGE_OP_LABEL_KEYS` flavour (number vs date). */
  inputType: "date" | "number";
  suffixes: { readonly start: string; readonly end: string };
  labels: Required<TableLabels>;
}

/**
 * Operator-first range field: a comparison `<select>` (its placeholder
 * option clears the pair), then ONE value input — or a labeled From/To
 * pair for `between`. The persisted state stays the inclusive
 * `<key><start>` / `<key><end>` pair, written through `setExtras`.
 */
function RangeField<TRow>({
  def,
  source,
  classNames,
  inputType,
  suffixes,
  labels,
}: Readonly<RangeFieldProps<TRow>>) {
  const lowKey = def.key + suffixes.start;
  const highKey = def.key + suffixes.end;
  // The chosen comparison is widget-local UI state (an operator with no
  // value persists nothing); it seeds from the persisted pair, so a
  // URL-restored pair reopens on its matching operator.
  const [op, setOp] = useState<RangeOp | undefined>(
    () => readRangeWidget(source.extra, lowKey, highKey).op
  );
  // Values stay bag-driven so chips / Clear all reset them live. The
  // single-value operators read the bound they write — `lte` the upper.
  const a = asText(source.extra[op === "lte" ? highKey : lowKey]);
  const b = asText(source.extra[highKey]);
  const write = (nextOp: RangeOp | undefined, nextA: string, nextB: string) =>
    source.setExtras(writeRangeWidget(nextOp, nextA, nextB, lowKey, highKey));
  const opLabelKeys = RANGE_OP_LABEL_KEYS[inputType];
  return (
    <GroupField caption={filterLabel(def)} classNames={classNames}>
      {/* Structural layout only (like the toolbar): parts sit side by side. */}
      <div style={{ display: "flex", gap: 8 }}>
        <select
          aria-label={labels.operator}
          data-adapttable-part="filter-operator"
          className={classNames.filterOperator}
          value={op ?? ""}
          onChange={(e) => {
            // Find (not cast) the next operator; "" → undefined → clear.
            const next = RANGE_OPS.find((o) => o === e.currentTarget.value);
            setOp(next);
            write(next, a, b);
          }}
        >
          <option value="">{labels.operator}</option>
          {RANGE_OPS.map((o) => (
            <option key={o} value={o}>
              {labels[opLabelKeys[o]]}
            </option>
          ))}
        </select>
        {op === "between" && (
          <>
            <RangeValueInput
              type={inputType}
              label={labels.from}
              value={a}
              onValue={(next) => write(op, next, b)}
              classNames={classNames}
            />
            <RangeValueInput
              type={inputType}
              label={labels.to}
              value={b}
              onValue={(next) => write(op, a, next)}
              classNames={classNames}
            />
          </>
        )}
        {op !== undefined && op !== "between" && (
          <RangeValueInput
            type={inputType}
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
      return <TextField def={def} source={source} classNames={classNames} />;
    case "select":
      return <SelectField def={def} source={source} classNames={classNames} />;
    case "multiSelect":
      return (
        <MultiSelectField def={def} source={source} classNames={classNames} />
      );
    case "dateRange":
      return (
        <RangeField
          def={def}
          source={source}
          classNames={classNames}
          inputType="date"
          suffixes={RANGE_SUFFIXES.dateRange}
          labels={labels}
        />
      );
    case "numberRange":
      return (
        <RangeField
          def={def}
          source={source}
          classNames={classNames}
          inputType="number"
          suffixes={RANGE_SUFFIXES.numberRange}
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
