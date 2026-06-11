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
  CheckboxGroup,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Select,
  Stack,
} from "@chakra-ui/react";
import { useId } from "react";

/** The slice of the table source the auto-built form reads and writes. */
export type FilterFormSource<TRow> = Pick<
  TableSource<TRow>,
  "extra" | "setExtra"
>;

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The resolved filter definitions, in render order. */
  defs: readonly FilterDef<TRow>[];
  /** The resolved table source (filter bag + setter). */
  source: FilterFormSource<TRow>;
  /** Chakra color scheme for option checkboxes. */
  colorScheme?: string;
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

/** One definition rendered as its kit-native Chakra control. */
function AutoFilterField<TRow>({
  def,
  source,
  colorScheme,
}: Readonly<{
  def: FilterDef<TRow>;
  source: FilterFormSource<TRow>;
  colorScheme?: string;
}>) {
  const id = useId();
  const { extra, setExtra } = source;
  const label = filterLabel(def);
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
            value={scalar(extra[def.key])}
            onChange={(e) => setExtra(def.key, e.target.value)}
          >
            <option value="">All</option>
            {(def.options ?? []).map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
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
            <HStack spacing={3} flexWrap="wrap" rowGap={1}>
              {(def.options ?? []).map((option, index) => (
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
          </CheckboxGroup>
        </FormControl>
      );
    case "dateRange":
    case "numberRange": {
      const [startKey, endKey] = filterStateKeys(def);
      const suffixes = RANGE_SUFFIXES[def.type];
      const inputType = def.type === "dateRange" ? "date" : "number";
      return (
        <FormControl>
          <FormLabel fontSize="sm" mb={1} htmlFor={`${id}-start`}>
            {label}
          </FormLabel>
          <HStack spacing={2}>
            <Input
              id={`${id}-start`}
              size="sm"
              type={inputType}
              aria-label={`${label} ${suffixes.start}`}
              value={scalar(extra[startKey!])}
              onChange={(e) => setExtra(startKey!, e.target.value)}
            />
            <Input
              id={`${id}-end`}
              size="sm"
              type={inputType}
              aria-label={`${label} ${suffixes.end}`}
              value={scalar(extra[endKey!])}
              onChange={(e) => setExtra(endKey!, e.target.value)}
            />
          </HStack>
        </FormControl>
      );
    }
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
}: Readonly<AutoFilterFormProps<TRow>>) {
  return (
    <Stack spacing={3}>
      {defs.map((def) => (
        <AutoFilterField
          key={def.key}
          def={def}
          source={source}
          colorScheme={colorScheme}
        />
      ))}
    </Stack>
  );
}
