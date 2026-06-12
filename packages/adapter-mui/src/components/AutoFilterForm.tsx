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
  CircularProgress,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  TextField,
} from "@mui/material";
import type { ReactNode } from "react";
import { useState } from "react";

/** The slice of the source the auto-built form reads and writes. */
type FilterBag<TRow> = Pick<
  TableSource<TRow>,
  "extra" | "setExtra" | "setExtras"
>;

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The resolved declarative definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The filter bag the widgets read from and write to. */
  source: FilterBag<TRow>;
  /** Resolved labels for the operator-first range widgets. */
  labels: Required<TableLabels>;
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

function TextFilter<TRow>({ def, source }: Readonly<FieldProps<TRow>>) {
  return (
    <TextField
      size="small"
      label={filterLabel(def)}
      placeholder={def.placeholder}
      value={scalarText(source.extra[def.key])}
      onChange={(e) => source.setExtra(def.key, e.target.value)}
    />
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

/**
 * Operator-first range widget: a comparison select, then one value input —
 * or a From/To pair for "between". The UI state is the operator alone; the
 * bounds always live in the source's `Min`/`Max` (`From`/`To`) pair, so
 * URLs, chips, and predicates are untouched by the operator presentation.
 */
function RangeFilter<TRow>({
  def,
  type,
  source,
  labels,
}: Readonly<LabeledFieldProps<TRow> & { type: keyof typeof RANGE_SUFFIXES }>) {
  const suffixes = RANGE_SUFFIXES[type];
  const lowKey = def.key + suffixes.start;
  const highKey = def.key + suffixes.end;
  const opLabelKeys =
    RANGE_OP_LABEL_KEYS[type === "dateRange" ? "date" : "number"];
  const state = readRangeWidget(source.extra, lowKey, highKey);
  // The operator is presentation state, seeded from the persisted pair so a
  // restored URL reopens on the comparison it encodes.
  const [op, setOp] = useState<RangeOp | undefined>(state.op);
  // The single bound lives under the high key for "at most", low otherwise.
  const single = op === "lte" ? state.b : state.a;
  const commit = (next: RangeOp | undefined, a: string, b: string) =>
    source.setExtras(writeRangeWidget(next, a, b, lowKey, highKey));
  const changeOp = (raw: string) => {
    const next = RANGE_OPS.find((candidate) => candidate === raw);
    setOp(next);
    // Carry the value into the new comparison; the upper bound only
    // survives while "between" keeps a field for it.
    commit(next, single, op === "between" ? state.b : "");
  };
  const input = (
    label: string,
    value: string,
    write: (raw: string) => void
  ) => (
    <TextField
      size="small"
      sx={{ flex: "1 1 7rem", minWidth: "7rem" }}
      type={type === "dateRange" ? "date" : "number"}
      label={label}
      value={value}
      onChange={(e) => write(e.target.value)}
      slotProps={{ inputLabel: { shrink: true } }}
    />
  );
  let bounds: ReactNode = null;
  if (op === "between") {
    bounds = (
      <>
        {input(labels.from, state.a, (raw) => commit("between", raw, state.b))}
        {input(labels.to, state.b, (raw) => commit("between", state.a, raw))}
      </>
    );
  } else if (op !== undefined) {
    bounds = input(labels.value, single, (raw) => commit(op, raw, ""));
  }
  return (
    <FormControl component="fieldset" variant="standard" sx={{ width: "100%" }}>
      <FormLabel component="legend" sx={{ mb: 0.75 }}>
        {filterLabel(def)}
      </FormLabel>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        <TextField
          select
          size="small"
          label={labels.operator}
          value={op ?? ""}
          onChange={(e) => changeOp(e.target.value)}
          slotProps={{
            select: { native: true },
            inputLabel: { shrink: true },
          }}
          sx={{ flex: "0 0 8.5rem", width: "8.5rem" }}
        >
          <option value="" />
          {RANGE_OPS.map((candidate) => (
            <option key={candidate} value={candidate}>
              {labels[opLabelKeys[candidate]]}
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
}: Readonly<LabeledFieldProps<TRow>>) {
  switch (def.type) {
    case "text":
      return <TextFilter def={def} source={source} />;
    case "select":
      return <SelectFilter def={def} source={source} />;
    case "multiSelect":
      return <MultiSelectFilter def={def} source={source} />;
    case "dateRange":
    case "numberRange":
      return (
        <RangeFilter
          def={def}
          type={def.type}
          source={source}
          labels={labels}
        />
      );
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
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <Stack spacing={1.5}>
      {defs.map((def) => (
        <FilterField key={def.key} def={def} source={source} labels={labels} />
      ))}
    </Stack>
  );
}
