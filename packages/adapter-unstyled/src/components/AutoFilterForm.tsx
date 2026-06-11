import {
  type FilterDef,
  filterLabel,
  type FilterValue,
  RANGE_SUFFIXES,
  type TableSource,
} from "@adapttable/core";
import type { ReactElement, ReactNode } from "react";

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
  /** Accessible name for inputs without a wrapping label (range halves). */
  ariaLabel?: string;
  classNames: DataTableClassNames;
}

/** One input bound to a filter-bag state key (empty text clears it). */
function BagInput<TRow>({
  source,
  stateKey,
  type,
  placeholder,
  ariaLabel,
  classNames,
}: Readonly<BagInputProps<TRow>>) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      aria-label={ariaLabel}
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
        <option value="">All</option>
        {(def.options ?? []).map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
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
  return (
    <GroupField caption={filterLabel(def)} classNames={classNames}>
      <div
        data-adapttable-part="filter-checkbox-group"
        className={classNames.filterCheckboxGroup}
      >
        {(def.options ?? []).map((option) => (
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
        ))}
      </div>
    </GroupField>
  );
}

interface RangeFieldProps<TRow> extends DefFieldProps<TRow> {
  inputType: "date" | "number";
  suffixes: { readonly start: string; readonly end: string };
}

/** Two-input range field writing `<key><start>` / `<key><end>` state keys. */
function RangeField<TRow>({
  def,
  source,
  classNames,
  inputType,
  suffixes,
}: Readonly<RangeFieldProps<TRow>>) {
  const caption = filterLabel(def);
  return (
    <GroupField caption={caption} classNames={classNames}>
      {/* Structural layout only (like the toolbar): halves sit side by side. */}
      <div style={{ display: "flex", gap: 8 }}>
        <BagInput
          source={source}
          stateKey={def.key + suffixes.start}
          type={inputType}
          ariaLabel={`${caption} ${suffixes.start}`}
          classNames={classNames}
        />
        <BagInput
          source={source}
          stateKey={def.key + suffixes.end}
          type={inputType}
          ariaLabel={`${caption} ${suffixes.end}`}
          classNames={classNames}
        />
      </div>
    </GroupField>
  );
}

function FilterField<TRow>({
  def,
  source,
  classNames,
}: Readonly<DefFieldProps<TRow>>): ReactElement {
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
}

/**
 * The auto-built filter form for the declarative `filters` array: one
 * semantic field per definition (`text` input, `select` with an "All"
 * option, `multiSelect` checkbox list, `dateRange` / `numberRange` input
 * pairs), each carrying `data-adapttable-part` hooks and `classNames`
 * overrides. Controls read `source.extra` and write through
 * `source.setExtra` — an empty value clears the key.
 *
 * @typeParam TRow - The row type.
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
  classNames = {},
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <>
      {defs.map((def) => (
        <FilterField
          key={def.key}
          def={def}
          source={source}
          classNames={classNames}
        />
      ))}
    </>
  );
}
