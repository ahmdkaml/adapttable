import {
  type ExtraFilters,
  type FilterDef,
  filterLabel,
  filterStateKeys,
  type FilterValue,
  RANGE_OP_LABEL_KEYS,
  RANGE_OPS,
  type RangeOp,
  readRangeWidget,
  type TableLabels,
  type TableSource,
  useFilterOptions,
  writeRangeWidget,
} from "@adapttable/core";
import {
  Checkbox,
  Flex,
  Input,
  InputNumber,
  Select,
  Space,
  Spin,
  Typography,
} from "antd";
import { useState } from "react";

/** The widget flavour — which operator wording the range select shows. */
type RangeFlavour = keyof typeof RANGE_OP_LABEL_KEYS;

/** A label key for one localized operator name, in either flavour. */
type RangeOpLabelKey = (typeof RANGE_OP_LABEL_KEYS)[RangeFlavour][RangeOp];

/** The pre-resolved strings the operator-first range widgets render. */
export type RangeFilterLabels = Pick<
  Required<TableLabels>,
  "operator" | "value" | "from" | "to" | RangeOpLabelKey
>;

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The merged, ordered filter definitions from the filter runtime. */
  defs: readonly FilterDef<TRow>[];
  /** The resolved source whose `extra` bag the controls read and write. */
  source: Pick<TableSource<TRow>, "extra" | "setExtra" | "setExtras">;
  /** Localized strings for the operator-first range widgets. */
  labels: RangeFilterLabels;
}

/** A scalar state value as input text (`""` when unset). */
function scalarValue(value: FilterValue): string {
  return typeof value === "string" ? value : "";
}

/** A multiSelect value as a string list — tolerates a scalar from the URL. */
function listValue(value: FilterValue): string[] {
  if (Array.isArray(value)) return value;
  if (value === undefined || value === "") return [];
  return [String(value)];
}

/** A persisted range bound as input text (`""` when unset). */
function boundValue(value: FilterValue): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

interface RangeFieldProps {
  /** The filter's display label — prefixes each control's aria-label. */
  label: string;
  /** Number vs date wording for the operator choices. */
  flavour: RangeFlavour;
  /** State key of the inclusive lower bound (`…Min` / `…From`). */
  lowKey: string;
  /** State key of the inclusive upper bound (`…Max` / `…To`). */
  highKey: string;
  extra: ExtraFilters;
  setExtras: (updates: ExtraFilters) => void;
  labels: RangeFilterLabels;
}

/**
 * The operator-first range control shared by `numberRange` and `dateRange`:
 * pick the comparison, then fill ONE value — or a From/To pair for
 * "Between". The persisted state stays the inclusive low/high pair
 * (`readRangeWidget` / `writeRangeWidget`), so URLs, chips, predicates and
 * the server query contract are unchanged; only the entry UX is new. The
 * operator itself is local UI state — choosing one before typing a value
 * persists nothing, and clearing the select clears the whole pair.
 */
function RangeField({
  label,
  flavour,
  lowKey,
  highKey,
  extra,
  setExtras,
  labels,
}: Readonly<RangeFieldProps>) {
  const [op, setOp] = useState<RangeOp | undefined>(
    () => readRangeWidget(extra, lowKey, highKey).op
  );
  const low = boundValue(extra[lowKey]);
  const high = boundValue(extra[highKey]);
  // Single-input ops keep their value on one side of the pair: `lte` the
  // upper bound, everything else the lower (`eq` mirrors it to both).
  const single = op === "lte" ? high : low;
  const apply = (nextOp: RangeOp | undefined, a: string, b: string) => {
    setExtras(writeRangeWidget(nextOp, a, b, lowKey, highKey));
  };
  const changeOp = (next: RangeOp | undefined) => {
    setOp(next);
    // Carry the value(s) already entered into the new comparison; clearing
    // the operator (allowClear) clears the persisted pair with it.
    if (next === "between") apply(next, low, high);
    else apply(next, single, "");
  };
  const input = (
    suffix: string,
    value: string,
    commit: (next: string) => void
  ) => {
    if (flavour === "number") {
      return (
        <InputNumber
          size="small"
          style={{ width: "100%" }}
          aria-label={`${label} ${suffix}`}
          placeholder={suffix}
          value={value === "" ? null : Number(value)}
          onChange={(next) => commit(next === null ? "" : String(next))}
        />
      );
    }
    return (
      <Input
        size="small"
        type="date"
        aria-label={`${label} ${suffix}`}
        placeholder={suffix}
        value={value}
        onChange={(event) => commit(event.target.value)}
      />
    );
  };
  return (
    <Flex vertical gap={8} style={{ position: "relative" }}>
      <Select<RangeOp | undefined>
        size="small"
        allowClear
        aria-label={`${label} ${labels.operator}`}
        placeholder={labels.operator}
        value={op}
        onChange={changeOp}
        // Keep the dropdown inside this (position: relative) field so it
        // never counts as an outside click for the hosting popover.
        getPopupContainer={(trigger: HTMLElement) => trigger.parentElement!}
        options={RANGE_OPS.map((choice) => ({
          value: choice,
          label: labels[RANGE_OP_LABEL_KEYS[flavour][choice]],
        }))}
      />
      {op !== undefined &&
        op !== "between" &&
        input(labels.value, single, (next) => apply(op, next, ""))}
      {op === "between" && (
        <Flex gap={8}>
          {input(labels.from, low, (next) => apply("between", next, high))}
          {input(labels.to, high, (next) => apply("between", low, next))}
        </Flex>
      )}
    </Flex>
  );
}

interface ControlProps<TRow> {
  def: FilterDef<TRow>;
  source: AutoFilterFormProps<TRow>["source"];
  labels: RangeFilterLabels;
}

/**
 * The kit-native widget for one definition. Every control renders inline
 * (no portal), reads `extra[stateKey]` and writes through `setExtra` /
 * `setExtras` — empty text / empty list clears the key (and its URL param).
 *
 * Select/multiSelect choices resolve through `useFilterOptions`, never by
 * mapping `def.options` directly — the source may be an async loader. While
 * one is in flight the select shows a single disabled "…" option and the
 * checkbox group a small antd spinner.
 */
function FilterControl<TRow>({
  def,
  source,
  labels,
}: Readonly<ControlProps<TRow>>) {
  const label = filterLabel(def);
  const { options, loading } = useFilterOptions(def);
  const { extra, setExtra } = source;
  switch (def.type) {
    case "text":
      return (
        <Input
          size="small"
          aria-label={label}
          placeholder={def.placeholder}
          value={scalarValue(extra[def.key])}
          onChange={(event) => setExtra(def.key, event.target.value)}
        />
      );
    case "select":
      // A native select (antd-styled) instead of antd's portal-driven
      // <Select>, so the control works anywhere the popover renders.
      return (
        <select
          className="ant-input ant-input-sm"
          style={{ width: "100%" }}
          aria-label={label}
          value={scalarValue(extra[def.key])}
          onChange={(event) => setExtra(def.key, event.target.value)}
        >
          <option value="">All</option>
          {loading ? (
            <option disabled>…</option>
          ) : (
            options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))
          )}
        </select>
      );
    case "multiSelect":
      if (loading) return <Spin size="small" />;
      return (
        <Checkbox.Group
          options={options.map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={listValue(extra[def.key])}
          onChange={(values) => setExtra(def.key, values.map(String))}
        />
      );
    case "dateRange":
    case "numberRange": {
      const [lowKey, highKey] = filterStateKeys(def);
      return (
        <RangeField
          label={label}
          flavour={def.type === "numberRange" ? "number" : "date"}
          lowKey={lowKey!}
          highKey={highKey!}
          extra={extra}
          setExtras={source.setExtras}
          labels={labels}
        />
      );
    }
  }
}

/**
 * The auto-built filter form for the declarative `filters` array: one
 * labelled antd control per definition, all bound straight to the source's
 * extra-filter bag (so the URL, chips, and — on frontend data — the row
 * predicate react immediately).
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
  labels,
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <Space direction="vertical" size="middle" style={{ width: "100%" }}>
      {defs.map((def) => (
        <Space
          key={def.key}
          direction="vertical"
          size={4}
          style={{ width: "100%" }}
        >
          <Typography.Text strong style={{ fontSize: 12 }}>
            {filterLabel(def)}
          </Typography.Text>
          <FilterControl def={def} source={source} labels={labels} />
        </Space>
      ))}
    </Space>
  );
}
