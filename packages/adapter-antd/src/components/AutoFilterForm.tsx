import {
  type FilterDef,
  filterLabel,
  filterOpLabel,
  type FilterValue,
  joinRelativeToken,
  RELATIVE_PRESET_LABEL_KEYS,
  RELATIVE_PRESETS,
  splitRelativeToken,
  type TableLabels,
  type TableSource,
  useBooleanFilterWidget,
  useFilterOptions,
  useRangeFilterWidget,
  useTextFilterWidget,
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
/** Localized strings the operator-first widgets render. */
export type RangeFilterLabels = Required<TableLabels>;

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

/** Preset select + optional N for last/next. Stores the token. */
function RelativeTokenField({
  labels,
  value,
  onValue,
}: Readonly<{
  labels: Required<TableLabels>;
  value: string;
  onValue: (next: string) => void;
}>) {
  const { preset, n } = splitRelativeToken(value);
  const counted = preset === "last" || preset === "next";
  return (
    <>
      <Select
        size="small"
        style={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
        aria-label={labels.opRelative}
        value={preset}
        onChange={(next) => {
          const found = RELATIVE_PRESETS.find((p) => p === next);
          if (found) onValue(joinRelativeToken(found, n));
        }}
        getPopupContainer={(trigger: HTMLElement) => trigger.parentElement!}
        options={RELATIVE_PRESETS.map((p) => ({
          value: p,
          label: labels[RELATIVE_PRESET_LABEL_KEYS[p]],
        }))}
      />
      {counted && (
        <InputNumber
          size="small"
          min={1}
          style={{ flex: "0 0 4.5rem", width: "4.5rem" }}
          aria-label={labels.value}
          value={n}
          onChange={(next) =>
            onValue(joinRelativeToken(preset, next == null ? 1 : Number(next)))
          }
        />
      )}
    </>
  );
}

/**
 * The operator-first range control shared by `numberRange` and `dateRange`.
 * The operator is persisted as `f_<key>Op`.
 */
function RangeField<TRow>({
  def,
  source,
  labels,
}: Readonly<{
  def: FilterDef<TRow>;
  source: AutoFilterFormProps<TRow>["source"];
  labels: RangeFilterLabels;
}>) {
  const { label, ops, opLabelKeys, inputType, arity, op, setOp, a, b, write } =
    useRangeFilterWidget(def, source);
  const input = (
    suffix: string,
    value: string,
    commit: (next: string) => void
  ) => {
    if (inputType === "number") {
      return (
        <InputNumber
          size="small"
          style={{ flex: "1 1 6rem", minWidth: "6rem", width: "auto" }}
          aria-label={`${label} ${suffix}`}
          placeholder={suffix}
          value={value === "" ? null : Number(value)}
          onChange={(next) => commit(next === null ? "" : String(next))}
        />
      );
    }
    return (
      <Input
        style={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
        size="small"
        type={inputType === "date" ? "date" : "text"}
        aria-label={`${label} ${suffix}`}
        placeholder={suffix}
        value={value}
        onChange={(event) => commit(event.target.value)}
      />
    );
  };
  return (
    // Operator and value(s) share a row when they fit and wrap when they
    // don't (date inputs have a wide native minimum).
    <Flex gap={8} wrap style={{ position: "relative" }}>
      <Select
        size="small"
        allowClear
        style={{ flex: "0 0 8.5rem", width: "8.5rem" }}
        aria-label={`${label} ${labels.operator}`}
        placeholder={labels.operator}
        value={op}
        onChange={(next) => {
          const found = ops.find((choice) => choice === next);
          setOp(found);
          write(found, a, b);
        }}
        // Keep the dropdown inside this (position: relative) field so it
        // never counts as an outside click for the hosting popover.
        getPopupContainer={(trigger: HTMLElement) => trigger.parentElement!}
        options={ops.map((choice) => ({
          value: choice,
          label: filterOpLabel(
            labels,
            opLabelKeys[choice as keyof typeof opLabelKeys]
          ),
        }))}
      />
      {op === "relative" && (
        <RelativeTokenField
          labels={labels}
          value={a}
          onValue={(next) => write(op, next, "")}
        />
      )}
      {op !== undefined &&
        op !== "relative" &&
        arity !== "none" &&
        arity !== "two" &&
        input(labels.value, a, (next) => write(op, next, ""))}
      {arity === "two" && (
        <>
          {input(labels.from, a, (next) => write(op, next, b))}
          {input(labels.to, b, (next) => write(op, a, next))}
        </>
      )}
    </Flex>
  );
}

/** Operator-first text filter: comparison select, then the term (if needed). */
function TextFilterField<TRow>({
  def,
  source,
  labels,
}: Readonly<{
  def: FilterDef<TRow>;
  source: AutoFilterFormProps<TRow>["source"];
  labels: RangeFilterLabels;
}>) {
  const { ops, opLabelKeys, op, value, needsValue, write } =
    useTextFilterWidget(def, source);
  const label = filterLabel(def);
  return (
    <Flex gap={8} wrap style={{ position: "relative" }}>
      <Select
        size="small"
        style={{ flex: "0 0 8.5rem", width: "8.5rem" }}
        aria-label={`${label} ${labels.operator}`}
        data-adapttable-part="filter-operator"
        value={op}
        onChange={(next) => {
          const found = ops.find((choice) => choice === next);
          if (found) write(found, value);
        }}
        getPopupContainer={(trigger: HTMLElement) => trigger.parentElement!}
        options={ops.map((choice) => ({
          value: choice,
          label: filterOpLabel(labels, opLabelKeys[choice]),
        }))}
      />
      {needsValue && (
        <Input
          size="small"
          aria-label={label}
          data-adapttable-part="filter-input"
          placeholder={def.placeholder}
          value={value}
          onChange={(event) => write(op, event.target.value)}
          style={{ flex: "1 1 7rem", minWidth: "7rem" }}
        />
      )}
    </Flex>
  );
}

function BooleanFilterField<TRow>({
  def,
  source,
  labels,
}: Readonly<ControlProps<TRow>>) {
  const { label, choice, write } = useBooleanFilterWidget(def, source);
  return (
    <select
      className="ant-input ant-input-sm"
      style={{ width: "100%" }}
      aria-label={label}
      data-adapttable-part="filter-select"
      value={choice}
      onChange={(event) => {
        const next = event.target.value;
        if (next === "" || next === "true" || next === "false") write(next);
      }}
    >
      <option value="">{labels.boolAny}</option>
      <option value="true">{labels.boolTrue}</option>
      <option value="false">{labels.boolFalse}</option>
    </select>
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
      return <TextFilterField def={def} source={source} labels={labels} />;
    case "boolean":
      return <BooleanFilterField def={def} source={source} labels={labels} />;
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
    case "numberRange":
      return <RangeField def={def} source={source} labels={labels} />;
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
    <Space orientation="vertical" size="middle" style={{ width: "100%" }}>
      {defs.map((def) => (
        <Space
          key={def.key}
          orientation="vertical"
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
