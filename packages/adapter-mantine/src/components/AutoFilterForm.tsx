import {
  type FilterDef,
  filterLabel,
  type FilterValue,
  RANGE_OP_LABEL_KEYS,
  RANGE_OPS,
  RANGE_SUFFIXES,
  type RangeOp,
  readRangeWidget,
  type TableLabels,
  type TableSource,
  useFilterOptions,
  writeRangeWidget,
} from "@adapttable/core";
import {
  Checkbox,
  Group,
  Input,
  Loader,
  NativeSelect,
  NumberInput,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { type ReactNode, useState } from "react";

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The resolved declarative definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The resolved source whose `extra` bag the controls read and write. */
  source: TableSource<TRow>;
  /** Resolved labels — the range widgets read the operator/value strings. */
  labels: Required<TableLabels>;
}

/** A scalar filter value as input text (`""` when unset). */
const asText = (value: FilterValue): string =>
  value == null ? "" : String(value);

/** A multi-select value as an array, tolerating a scalar from the URL. */
const asList = (value: FilterValue): string[] => {
  if (value == null || value === "") return [];
  return Array.isArray(value) ? value : [String(value)];
};

/** The select's raw option value parsed back to a known operator. */
const asOp = (value: string | null): RangeOp | undefined =>
  RANGE_OPS.find((op) => op === value);

/** Which operator label set each range type reads. */
const RANGE_FLAVOUR = { numberRange: "number", dateRange: "date" } as const;

/**
 * The operator-first control shared by the `numberRange` / `dateRange`
 * types: pick a comparison (Equal / At least / …), then fill ONE value —
 * or From/To when "Between". The persisted state stays the inclusive
 * `Min`/`Max` (`From`/`To`) pair via {@link readRangeWidget} /
 * {@link writeRangeWidget}, so URLs, chips and predicates are unchanged.
 */
function RangeField<TRow>({
  def,
  source,
  kind,
  labels,
}: Readonly<{
  def: FilterDef<TRow>;
  source: TableSource<TRow>;
  kind: "numberRange" | "dateRange";
  labels: Required<TableLabels>;
}>) {
  const label = filterLabel(def);
  const lowKey = def.key + RANGE_SUFFIXES[kind].start;
  const highKey = def.key + RANGE_SUFFIXES[kind].end;

  // The operator is UI state seeded from the persisted pair (URL state
  // mounts pre-selected); it wins over the derived value so a half-filled
  // "Between" keeps showing two inputs while only one bound is stored.
  const derived = readRangeWidget(source.extra, lowKey, highKey);
  const [chosen, setChosen] = useState<RangeOp | null>(null);
  const op = chosen ?? derived.op ?? null;

  const low = asText(source.extra[lowKey]);
  const high = asText(source.extra[highKey]);
  /** The one visible value outside "Between" (`lte` stores the upper bound). */
  const single = op === "lte" ? high : low;

  const write = (nextOp: RangeOp | undefined, a: string, b: string) =>
    source.setExtras(writeRangeWidget(nextOp, a, b, lowKey, highKey));

  const handleOp = (value: string | null) => {
    const next = asOp(value);
    setChosen(next ?? null);
    // Switching keeps the first value; clearing the select clears the pair.
    write(next, single, "");
  };

  const flavour = RANGE_FLAVOUR[kind];
  const opLabelKeys = RANGE_OP_LABEL_KEYS[flavour];
  const data = RANGE_OPS.map((value) => ({
    value,
    label: labels[opLabelKeys[value]],
  }));

  const valueInput = (
    text: string,
    value: string,
    commit: (next: string) => void
  ) =>
    flavour === "number" ? (
      <NumberInput
        size="sm"
        hideControls
        aria-label={`${label} ${text}`}
        placeholder={text}
        value={value}
        onChange={(next) => commit(String(next))}
      />
    ) : (
      <TextInput
        type="date"
        size="sm"
        aria-label={`${label} ${text}`}
        placeholder={text}
        value={value}
        onChange={(e) => commit(e.currentTarget.value)}
      />
    );

  let values: ReactNode = null;
  if (op === "between") {
    values = (
      <Group gap="xs" grow wrap="nowrap">
        {valueInput(labels.from, low, (next) => write("between", next, high))}
        {valueInput(labels.to, high, (next) => write("between", low, next))}
      </Group>
    );
  } else if (op) {
    values = valueInput(labels.value, single, (next) => write(op, next, ""));
  }

  return (
    <Stack gap={4}>
      <Input.Label size="sm">{label}</Input.Label>
      <Select
        size="sm"
        clearable
        aria-label={`${label} ${labels.operator}`}
        placeholder={labels.operator}
        data={data}
        value={op}
        onChange={handleOp}
        comboboxProps={{ withinPortal: false }}
      />
      {values}
    </Stack>
  );
}

/**
 * Single-choice control. Options resolve through {@link useFilterOptions}
 * (static array, async loader, or none); while a loader is in flight the
 * select shows one disabled placeholder option.
 */
function SelectControl<TRow>({
  def,
  source,
}: Readonly<{ def: FilterDef<TRow>; source: TableSource<TRow> }>) {
  const label = filterLabel(def);
  const { options, loading } = useFilterOptions(def);
  const data = loading
    ? [{ value: "", label: "…", disabled: true }]
    : [{ value: "", label: "All" }, ...options];
  return (
    <NativeSelect
      size="sm"
      label={label}
      data={data}
      value={asText(source.extra[def.key])}
      onChange={(e) => source.setExtra(def.key, e.currentTarget.value)}
    />
  );
}

/**
 * Multi-choice control. Options resolve through {@link useFilterOptions};
 * while a loader is in flight the group shows a small spinner instead of
 * checkboxes.
 */
function MultiSelectControl<TRow>({
  def,
  source,
}: Readonly<{ def: FilterDef<TRow>; source: TableSource<TRow> }>) {
  const label = filterLabel(def);
  const { options, loading } = useFilterOptions(def);
  return (
    <Checkbox.Group
      label={label}
      value={asList(source.extra[def.key])}
      onChange={(values) => source.setExtra(def.key, values)}
    >
      <Group gap="sm" mt={4}>
        {loading ? (
          <Loader size="xs" />
        ) : (
          options.map((option) => (
            <Checkbox
              key={option.value}
              size="sm"
              value={option.value}
              label={option.label}
            />
          ))
        )}
      </Group>
    </Checkbox.Group>
  );
}

/** One labeled, kit-native control for a single filter definition. */
function FilterControl<TRow>({
  def,
  source,
  labels,
}: Readonly<{
  def: FilterDef<TRow>;
  source: TableSource<TRow>;
  labels: Required<TableLabels>;
}>) {
  switch (def.type) {
    case "text":
      return (
        <TextInput
          size="sm"
          label={filterLabel(def)}
          placeholder={def.placeholder}
          value={asText(source.extra[def.key])}
          onChange={(e) => source.setExtra(def.key, e.currentTarget.value)}
        />
      );
    case "select":
      return <SelectControl def={def} source={source} />;
    case "multiSelect":
      return <MultiSelectControl def={def} source={source} />;
    case "dateRange":
    case "numberRange":
      return (
        <RangeField def={def} source={source} kind={def.type} labels={labels} />
      );
  }
}

/**
 * The auto-built filter form: one labeled, Mantine-native control per
 * declarative {@link FilterDef}. Values live in the source's `extra` bag
 * (so the URL, chips and — on frontend data — the predicate all follow);
 * clearing a control writes the empty value, which drops the URL param.
 * Range types render operator-first: an operator select plus one value
 * input (two for "Between"), persisted as the inclusive pair.
 *
 * @typeParam TRow - The row type.
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
  labels,
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <Stack gap="sm">
      {defs.map((def) => (
        <FilterControl
          key={def.key}
          def={def}
          source={source}
          labels={labels}
        />
      ))}
    </Stack>
  );
}
