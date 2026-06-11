import {
  type FilterDef,
  filterLabel,
  type FilterValue,
  RANGE_SUFFIXES,
  type TableSource,
  useFilterOptions,
} from "@adapttable/core";
import {
  Checkbox,
  Group,
  Input,
  Loader,
  NativeSelect,
  Stack,
  TextInput,
} from "@mantine/core";

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The resolved declarative definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The resolved source whose `extra` bag the controls read and write. */
  source: TableSource<TRow>;
}

/** A scalar filter value as input text (`""` when unset). */
const asText = (value: FilterValue): string =>
  value == null ? "" : String(value);

/** A multi-select value as an array, tolerating a scalar from the URL. */
const asList = (value: FilterValue): string[] => {
  if (value == null || value === "") return [];
  return Array.isArray(value) ? value : [String(value)];
};

/** The two-field control shared by the `dateRange` / `numberRange` types. */
function RangePair<TRow>({
  def,
  source,
  inputType,
  start,
  end,
}: Readonly<{
  def: FilterDef<TRow>;
  source: TableSource<TRow>;
  inputType: "date" | "number";
  start: string;
  end: string;
}>) {
  const label = filterLabel(def);
  return (
    <Stack gap={4}>
      <Input.Label size="sm">{label}</Input.Label>
      <Group gap="xs" grow wrap="nowrap">
        <TextInput
          type={inputType}
          size="sm"
          aria-label={`${label} ${start}`}
          value={asText(source.extra[def.key + start])}
          onChange={(e) =>
            source.setExtra(def.key + start, e.currentTarget.value)
          }
        />
        <TextInput
          type={inputType}
          size="sm"
          aria-label={`${label} ${end}`}
          value={asText(source.extra[def.key + end])}
          onChange={(e) =>
            source.setExtra(def.key + end, e.currentTarget.value)
          }
        />
      </Group>
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
}: Readonly<{ def: FilterDef<TRow>; source: TableSource<TRow> }>) {
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
      return (
        <RangePair
          def={def}
          source={source}
          inputType="date"
          start={RANGE_SUFFIXES.dateRange.start}
          end={RANGE_SUFFIXES.dateRange.end}
        />
      );
    case "numberRange":
      return (
        <RangePair
          def={def}
          source={source}
          inputType="number"
          start={RANGE_SUFFIXES.numberRange.start}
          end={RANGE_SUFFIXES.numberRange.end}
        />
      );
  }
}

/**
 * The auto-built filter form: one labeled, Mantine-native control per
 * declarative {@link FilterDef}. Values live in the source's `extra` bag
 * (so the URL, chips and — on frontend data — the predicate all follow);
 * clearing a control writes the empty value, which drops the URL param.
 *
 * @typeParam TRow - The row type.
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <Stack gap="sm">
      {defs.map((def) => (
        <FilterControl key={def.key} def={def} source={source} />
      ))}
    </Stack>
  );
}
