import {
  ChecklistFilter,
  defaultFilterRegistry,
  type FilterDef,
  filterLabel,
  filterOpLabel,
  type FilterTypeRegistry,
  type FilterValue,
  filterWidgetKind,
  joinRelativeToken,
  RELATIVE_PRESET_LABEL_KEYS,
  RELATIVE_PRESETS,
  renderRegisteredFilter,
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
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  TextField,
} from "@mui/material";
import type { ReactNode } from "react";

/** The slice of the source the auto-built form reads and writes. */
type FilterBag<TRow> = Pick<
  TableSource<TRow>,
  "extra" | "setExtra" | "setExtras" | "allFilteredRows" | "facets"
>;

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The resolved declarative definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The filter bag the widgets read from and write to. */
  source: FilterBag<TRow>;
  /** Resolved labels for the operator-first range widgets. */
  labels: Required<TableLabels>;
  /** Type registry; defaults to the built-ins. */
  registry?: FilterTypeRegistry;
}

/** Props for one rendered filter widget. */
interface FieldProps<TRow> {
  def: FilterDef<TRow>;
  source: FilterBag<TRow>;
}

/** Field props for the widgets that also render resolved labels. */
interface LabeledFieldProps<TRow> extends FieldProps<TRow> {
  labels: Required<TableLabels>;
}

/** A scalar filter value as input text (arrays/blanks render empty). */
function scalarText(value: FilterValue): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

/** A multi-select filter value as the checked-value list. */
function selectedList(value: FilterValue): readonly string[] {
  return Array.isArray(value) ? value : [];
}

function TextFilter<TRow>({
  def,
  source,
  labels,
}: Readonly<LabeledFieldProps<TRow>>) {
  const { label, ops, opLabelKeys, op, value, needsValue, write } =
    useTextFilterWidget(def, source);
  return (
    <FormControl component="fieldset" variant="standard" sx={{ width: "100%" }}>
      <FormLabel component="legend" sx={{ mb: 0.75 }}>
        {label}
      </FormLabel>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label={labels.operator}
          value={op}
          onChange={(e) => {
            const next = ops.find((choice) => choice === e.target.value);
            if (next) write(next, value);
          }}
          data-adapttable-part="filter-operator"
          slotProps={{
            select: { native: true },
            inputLabel: { shrink: true },
          }}
          sx={{ flex: "0 0 8.5rem", width: "8.5rem" }}
        >
          {ops.map((choice) => (
            <option key={choice} value={choice}>
              {filterOpLabel(labels, opLabelKeys[choice])}
            </option>
          ))}
        </TextField>
        {needsValue && (
          <TextField
            size="small"
            label={labels.value}
            placeholder={def.placeholder}
            value={value}
            onChange={(e) => write(op, e.target.value)}
            slotProps={{
              htmlInput: { "data-adapttable-part": "filter-input" },
            }}
            sx={{ flex: "1 1 7rem", minWidth: "7rem" }}
          />
        )}
      </Stack>
    </FormControl>
  );
}

function BooleanFilter<TRow>({
  def,
  source,
  labels,
}: Readonly<LabeledFieldProps<TRow>>) {
  const { label, choice, write } = useBooleanFilterWidget(def, source);
  return (
    <TextField
      select
      size="small"
      label={label}
      value={choice}
      onChange={(e) => {
        const next = e.target.value;
        if (next === "" || next === "true" || next === "false") write(next);
      }}
      data-adapttable-part="filter-select"
      slotProps={{
        select: { native: true },
        inputLabel: { shrink: true },
      }}
    >
      <option value="">{labels.boolAny}</option>
      <option value="true">{labels.boolTrue}</option>
      <option value="false">{labels.boolFalse}</option>
    </TextField>
  );
}

function SelectFilter<TRow>({ def, source }: Readonly<FieldProps<TRow>>) {
  // The options source may be an array OR an async loader — never map it
  // directly. The hook resolves both (and reports loader progress).
  const { options, loading } = useFilterOptions(def);
  return (
    <TextField
      select
      size="small"
      label={filterLabel(def)}
      value={scalarText(source.extra[def.key])}
      onChange={(e) => source.setExtra(def.key, e.target.value)}
      slotProps={{
        select: { native: true },
        inputLabel: { shrink: true },
      }}
    >
      <option value="">All</option>
      {loading && (
        <option value="" disabled>
          …
        </option>
      )}
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </TextField>
  );
}

function MultiSelectFilter<TRow>({ def, source }: Readonly<FieldProps<TRow>>) {
  const { options, loading } = useFilterOptions(def);
  const checked = selectedList(source.extra[def.key]);
  const toggle = (value: string, on: boolean) => {
    const next = on ? [...checked, value] : checked.filter((v) => v !== value);
    source.setExtra(def.key, next);
  };
  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel component="legend">{filterLabel(def)}</FormLabel>
      <FormGroup row sx={{ columnGap: 1.5 }}>
        {loading ? (
          <CircularProgress size={16} />
        ) : (
          options.map((option) => (
            <FormControlLabel
              key={option.value}
              label={option.label}
              control={
                <Checkbox
                  size="small"
                  checked={checked.includes(option.value)}
                  onChange={(_, on) => toggle(option.value, on)}
                />
              }
            />
          ))
        )}
      </FormGroup>
    </FormControl>
  );
}

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
      <TextField
        select
        size="small"
        label={labels.opRelative}
        value={preset}
        onChange={(e) => {
          const found = RELATIVE_PRESETS.find((p) => p === e.target.value);
          if (found) onValue(joinRelativeToken(found, n));
        }}
        slotProps={{
          select: { native: true },
          inputLabel: { shrink: true },
        }}
        sx={{ flex: "1 1 8.5rem", minWidth: "8.5rem" }}
      >
        {RELATIVE_PRESETS.map((p) => (
          <option key={p} value={p}>
            {labels[RELATIVE_PRESET_LABEL_KEYS[p]]}
          </option>
        ))}
      </TextField>
      {counted && (
        <TextField
          size="small"
          type="number"
          label={labels.value}
          value={n}
          onChange={(e) =>
            onValue(joinRelativeToken(preset, Number(e.target.value)))
          }
          slotProps={{
            htmlInput: { min: 1 },
            inputLabel: { shrink: true },
          }}
          sx={{ flex: "0 0 4.5rem", width: "4.5rem" }}
        />
      )}
    </>
  );
}

/**
 * Operator-first range widget: a comparison select, then one value input —
 * or a From/To pair for "between". The operator is persisted as `f_<key>Op`.
 */
function RangeFilter<TRow>({
  def,
  source,
  labels,
}: Readonly<LabeledFieldProps<TRow>>) {
  const { label, ops, opLabelKeys, inputType, arity, op, setOp, a, b, write } =
    useRangeFilterWidget(def, source);
  const boundType = inputType === "text" ? "text" : inputType;
  const input = (
    caption: string,
    value: string,
    commit: (raw: string) => void
  ) => (
    <TextField
      size="small"
      sx={{ flex: "1 1 7rem", minWidth: "7rem" }}
      type={boundType}
      label={caption}
      value={value}
      onChange={(e) => commit(e.target.value)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
  let bounds: ReactNode = null;
  if (arity === "two") {
    bounds = (
      <>
        {input(labels.from, a, (raw) => write(op, raw, b))}
        {input(labels.to, b, (raw) => write(op, a, raw))}
      </>
    );
  } else if (op === "relative") {
    bounds = (
      <RelativeTokenField
        labels={labels}
        value={a}
        onValue={(raw) => write(op, raw, "")}
      />
    );
  } else if (op !== undefined && arity !== "none") {
    bounds = input(labels.value, a, (raw) => write(op, raw, ""));
  }
  return (
    <FormControl component="fieldset" variant="standard" sx={{ width: "100%" }}>
      <FormLabel component="legend" sx={{ mb: 0.75 }}>
        {label}
      </FormLabel>
      <Stack direction="row" spacing={1} useFlexGap sx={{ flexWrap: "wrap" }}>
        <TextField
          select
          size="small"
          label={labels.operator}
          value={op ?? ""}
          onChange={(e) => {
            const next = ops.find((candidate) => candidate === e.target.value);
            setOp(next);
            write(next, a, b);
          }}
          slotProps={{
            select: { native: true },
            inputLabel: { shrink: true },
          }}
          sx={{ flex: "0 0 8.5rem", width: "8.5rem" }}
        >
          <option value="" />
          {ops.map((candidate) => (
            <option key={candidate} value={candidate}>
              {filterOpLabel(
                labels,
                opLabelKeys[candidate as keyof typeof opLabelKeys]
              )}
            </option>
          ))}
        </TextField>
        {bounds}
      </Stack>
    </FormControl>
  );
}

function FilterField<TRow>({
  def,
  source,
  labels,
  registry,
}: Readonly<LabeledFieldProps<TRow> & { registry: FilterTypeRegistry }>) {
  const custom = renderRegisteredFilter(def, source, labels, registry);
  if (custom) return custom;
  switch (filterWidgetKind(def, registry)) {
    case "text":
      return <TextFilter def={def} source={source} labels={labels} />;
    case "boolean":
      return <BooleanFilter def={def} source={source} labels={labels} />;
    case "select":
      return <SelectFilter def={def} source={source} />;
    case "multiSelect":
      return <MultiSelectFilter def={def} source={source} />;
    case "checklist":
      return <ChecklistFilter def={def} source={source} labels={labels} />;
    case "dateRange":
    case "numberRange":
      return <RangeFilter def={def} source={source} labels={labels} />;
    default:
      return null;
  }
}

/**
 * The auto-built filter form: one MUI widget per declarative definition,
 * reading and writing the source's extra-filter bag (so chips, URL state
 * and — on frontend data — the row predicate all stay in sync). The selects
 * render natively, so every control works inline, without portal menus.
 *
 * @typeParam TRow - The row type.
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
  labels,
  registry = defaultFilterRegistry,
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <Stack spacing={1.5}>
      {defs.map((def) => (
        <FilterField
          key={def.key}
          def={def}
          source={source}
          labels={labels}
          registry={registry}
        />
      ))}
    </Stack>
  );
}
