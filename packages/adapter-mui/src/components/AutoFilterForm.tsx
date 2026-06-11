import {
  type FilterDef,
  filterLabel,
  filterStateKeys,
  type FilterValue,
  RANGE_SUFFIXES,
  type TableSource,
} from "@adapttable/core";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Stack,
  TextField,
} from "@mui/material";

/** The slice of the source the auto-built form reads and writes. */
type FilterBag<TRow> = Pick<TableSource<TRow>, "extra" | "setExtra">;

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The resolved declarative definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The filter bag the widgets read from and write to. */
  source: FilterBag<TRow>;
}

/** Props for one rendered filter widget. */
interface FieldProps<TRow> {
  def: FilterDef<TRow>;
  source: FilterBag<TRow>;
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
      {(def.options ?? []).map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </TextField>
  );
}

function MultiSelectFilter<TRow>({ def, source }: Readonly<FieldProps<TRow>>) {
  const checked = selectedList(source.extra[def.key]);
  const toggle = (value: string, on: boolean) => {
    const next = on ? [...checked, value] : checked.filter((v) => v !== value);
    source.setExtra(def.key, next);
  };
  return (
    <FormControl component="fieldset" variant="standard">
      <FormLabel component="legend">{filterLabel(def)}</FormLabel>
      <FormGroup>
        {(def.options ?? []).map((option) => (
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
        ))}
      </FormGroup>
    </FormControl>
  );
}

function RangeFilter<TRow>({
  def,
  type,
  source,
}: Readonly<FieldProps<TRow> & { type: keyof typeof RANGE_SUFFIXES }>) {
  const label = filterLabel(def);
  const suffixes = RANGE_SUFFIXES[type];
  const fields = filterStateKeys(def).map((key, i) => ({
    key,
    suffix: i === 0 ? suffixes.start : suffixes.end,
  }));
  const write = (key: string, raw: string) =>
    source.setExtra(
      key,
      type === "numberRange" && raw !== "" ? Number(raw) : raw
    );
  return (
    <Stack direction="row" spacing={1}>
      {fields.map((field) => (
        <TextField
          key={field.key}
          size="small"
          type={type === "dateRange" ? "date" : "number"}
          label={`${label} ${field.suffix}`}
          value={scalarText(source.extra[field.key])}
          onChange={(e) => write(field.key, e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: 1 }}
        />
      ))}
    </Stack>
  );
}

function FilterField<TRow>({ def, source }: Readonly<FieldProps<TRow>>) {
  switch (def.type) {
    case "text":
      return <TextFilter def={def} source={source} />;
    case "select":
      return <SelectFilter def={def} source={source} />;
    case "multiSelect":
      return <MultiSelectFilter def={def} source={source} />;
    case "dateRange":
    case "numberRange":
      return <RangeFilter def={def} type={def.type} source={source} />;
  }
}

/**
 * The auto-built filter form: one MUI widget per declarative definition,
 * reading and writing the source's extra-filter bag (so chips, URL state
 * and — on frontend data — the row predicate all stay in sync). The select
 * renders natively, so every control works inline, without portal menus.
 *
 * @typeParam TRow - The row type.
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <Stack spacing={1.5}>
      {defs.map((def) => (
        <FilterField key={def.key} def={def} source={source} />
      ))}
    </Stack>
  );
}
