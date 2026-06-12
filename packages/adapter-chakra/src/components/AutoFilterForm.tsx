import {
  type Direction,
  type FilterDef,
  filterLabel,
  filterStateKeys,
  type FilterValue,
  RANGE_OP_LABEL_KEYS,
  RANGE_OPS,
  type RangeOp,
  readRangeWidget,
  resolveLabels,
  type TableLabels,
  type TableSource,
  useFilterOptions,
  writeRangeWidget,
} from "@adapttable/core";
import {
  Checkbox,
  CheckboxGroup,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Spinner,
  Stack,
} from "@chakra-ui/react";
import { useId, useState } from "react";

import { selectIconRootProps } from "./chrome";

/** The slice of the table source the auto-built form reads and writes. */
export type FilterFormSource<TRow> = Pick<
  TableSource<TRow>,
  "extra" | "setExtra" | "setExtras"
>;

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** Writing direction (flips the select chevron). */
  dir?: Direction;
  /** The resolved filter definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The resolved table source (filter bag + setters). */
  source: FilterFormSource<TRow>;
  /** Chakra color scheme for option checkboxes. */
  colorScheme?: string;
  /** Pre-translated label overrides (operator names, From/To, …). */
  labels?: TableLabels;
}

/** A scalar filter value as input text ("" when unset; numbers stringify). */
function scalar(value: FilterValue): string {
  return value == null ? "" : String(value);
}

/** A multi-select value as a list — tolerating a scalar from the URL. */
function list(value: FilterValue): string[] {
  if (Array.isArray(value)) return [...value];
  return value == null || value === "" ? [] : [String(value)];
}

/**
 * Operator-first range widget (`numberRange` / `dateRange`): a comparison
 * select, then ONE bound input — or a From/To pair for "Between". The
 * persisted state stays the inclusive `Min`/`Max` (`From`/`To`) pair, so the
 * operator itself is UI state seeded from the pair: the user's choice must
 * survive an emptied input, which clears both keys.
 */
function RangeField<TRow>({
  def,
  source,
  labels,
  dir,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  dir?: Direction;
}>) {
  const id = useId();
  const { extra, setExtras } = source;
  const label = filterLabel(def);
  const [lowKey, highKey] = filterStateKeys(def);
  const opLabels =
    RANGE_OP_LABEL_KEYS[def.type === "dateRange" ? "date" : "number"];
  const inputType = def.type === "dateRange" ? "date" : "number";
  const [op, setOp] = useState<RangeOp | undefined>(
    () => readRangeWidget(extra, lowKey!, highKey!).op
  );
  // Bounds derive from the persisted pair, so URL state and chip clears stay
  // the source of truth: "At most" reads the upper key, everything else the
  // lower one ("Equal" wrote both identical), "Between" reads both.
  const a = scalar(extra[op === "lte" ? highKey! : lowKey!]);
  const b = scalar(extra[highKey!]);
  const write = (nextOp: RangeOp | undefined, nextA: string, nextB: string) =>
    setExtras(writeRangeWidget(nextOp, nextA, nextB, lowKey!, highKey!));
  return (
    <FormControl>
      <FormLabel fontSize="sm" mb={1}>
        {label}
      </FormLabel>
      {/* Operator and value(s) share ONE row — it reads like a sentence:
          "At least [5]". */}
      <HStack spacing={2} align="flex-start" flexWrap="wrap" rowGap={2}>
        {/* Chakra renders `placeholder` as the empty first option, so the
            operator placeholder doubles as the "no comparison" clear choice. */}
        <Select
          size="sm"
          rootProps={{
            ...selectIconRootProps(dir),
            flex: "0 0 8.5rem",
            w: "8.5rem",
          }}
          placeholder={labels.operator}
          value={op ?? ""}
          onChange={(e) => {
            const next = RANGE_OPS.find((o) => o === e.target.value);
            setOp(next);
            write(next, a, b);
          }}
        >
          {RANGE_OPS.map((o) => (
            <option key={o} value={o}>
              {labels[opLabels[o]]}
            </option>
          ))}
        </Select>
        {op === "between" ? (
          <>
            <Input
              id={`${id}-a`}
              size="sm"
              flex="1 1 7rem"
              minW="7rem"
              type={inputType}
              aria-label={labels.from}
              placeholder={labels.from}
              value={a}
              onChange={(e) => write(op, e.target.value, b)}
            />
            <Input
              id={`${id}-b`}
              size="sm"
              flex="1 1 7rem"
              minW="7rem"
              type={inputType}
              aria-label={labels.to}
              placeholder={labels.to}
              value={b}
              onChange={(e) => write(op, a, e.target.value)}
            />
          </>
        ) : (
          op && (
            <Input
              id={`${id}-a`}
              size="sm"
              flex="1 1 7rem"
              minW="7rem"
              type={inputType}
              aria-label={labels.value}
              placeholder={labels.value}
              value={a}
              onChange={(e) => write(op, e.target.value, "")}
            />
          )
        )}
      </HStack>
    </FormControl>
  );
}

/** One definition rendered as its kit-native Chakra control. */
function AutoFilterField<TRow>({
  def,
  source,
  labels,
  colorScheme,
  dir,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  labels: Required<TableLabels>;
  colorScheme?: string;
  dir?: Direction;
}>) {
  const id = useId();
  const { extra, setExtra } = source;
  const label = filterLabel(def);
  // Static arrays resolve instantly; async loaders run once and report
  // `loading` so the select/checkbox controls can show a native affordance.
  const { options, loading } = useFilterOptions(def);
  switch (def.type) {
    case "text":
      return (
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            {label}
          </FormLabel>
          <Input
            size="sm"
            value={scalar(extra[def.key])}
            placeholder={def.placeholder}
            onChange={(e) => setExtra(def.key, e.target.value)}
          />
        </FormControl>
      );
    case "select":
      return (
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            {label}
          </FormLabel>
          <Select
            size="sm"
            rootProps={selectIconRootProps(dir)}
            value={scalar(extra[def.key])}
            onChange={(e) => setExtra(def.key, e.target.value)}
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
          </Select>
        </FormControl>
      );
    case "multiSelect":
      return (
        <FormControl>
          <FormLabel fontSize="sm" mb={1}>
            {label}
          </FormLabel>
          <CheckboxGroup
            colorScheme={colorScheme}
            value={list(extra[def.key])}
            onChange={(next) => setExtra(def.key, next.map(String))}
          >
            {loading ? (
              <Spinner size="xs" />
            ) : (
              <HStack spacing={3} flexWrap="wrap" rowGap={1}>
                {options.map((option, index) => (
                  <Checkbox
                    key={option.value}
                    id={`${id}-${index}`}
                    size="sm"
                    value={option.value}
                  >
                    {option.label}
                  </Checkbox>
                ))}
              </HStack>
            )}
          </CheckboxGroup>
        </FormControl>
      );
    case "dateRange":
    case "numberRange":
      return <RangeField def={def} source={source} labels={labels} dir={dir} />;
  }
}

/**
 * The auto-built filter form: one kit-native Chakra control per declarative
 * {@link FilterDef}, reading and writing the source's extra-filter bag —
 * `""` / `[]` clears a key. Rendered inside the filter popover or drawer
 * when the `filters` prop is the declarative array form.
 *
 * @typeParam TRow - The row type.
 */
export function AutoFilterForm<TRow>({
  defs,
  source,
  colorScheme,
  dir,
  labels,
}: Readonly<AutoFilterFormProps<TRow>>) {
  const resolved = resolveLabels(labels);
  return (
    <Stack spacing={3}>
      {defs.map((def) => (
        <AutoFilterField
          key={def.key}
          def={def}
          source={source}
          labels={resolved}
          colorScheme={colorScheme}
          dir={dir}
        />
      ))}
    </Stack>
  );
}
