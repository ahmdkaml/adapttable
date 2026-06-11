import {
  type ExtraFilters,
  type FilterDef,
  filterLabel,
  filterStateKeys,
  type FilterValue,
  type TableSource,
} from "@adapttable/core";
import { Checkbox, Flex, Input, InputNumber, Space, Typography } from "antd";

/** Props for {@link AutoFilterForm}. */
export interface AutoFilterFormProps<TRow> {
  /** The merged, ordered filter definitions from the filter runtime. */
  defs: readonly FilterDef<TRow>[];
  /** The resolved source whose `extra` bag the controls read and write. */
  source: Pick<TableSource<TRow>, "extra" | "setExtra">;
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

/** A numeric state value for `InputNumber` (`null` when unset). */
function numberValue(value: FilterValue): number | null {
  return typeof value === "number" ? value : null;
}

interface ControlProps<TRow> {
  def: FilterDef<TRow>;
  extra: ExtraFilters;
  setExtra: (key: string, value: FilterValue) => void;
}

/**
 * The kit-native widget for one definition. Every control renders inline
 * (no portal), reads `extra[stateKey]` and writes through `setExtra` —
 * empty text / empty list clears the key (and its URL param).
 */
function FilterControl<TRow>({
  def,
  extra,
  setExtra,
}: Readonly<ControlProps<TRow>>) {
  const label = filterLabel(def);
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
          {(def.options ?? []).map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      );
    case "multiSelect":
      return (
        <Checkbox.Group
          options={(def.options ?? []).map((option) => ({
            label: option.label,
            value: option.value,
          }))}
          value={listValue(extra[def.key])}
          onChange={(values) => setExtra(def.key, values.map(String))}
        />
      );
    case "dateRange": {
      const [fromKey, toKey] = filterStateKeys(def);
      return (
        <Flex gap={8}>
          <Input
            size="small"
            type="date"
            aria-label={`${label} from`}
            value={scalarValue(extra[fromKey!])}
            onChange={(event) => setExtra(fromKey!, event.target.value)}
          />
          <Input
            size="small"
            type="date"
            aria-label={`${label} to`}
            value={scalarValue(extra[toKey!])}
            onChange={(event) => setExtra(toKey!, event.target.value)}
          />
        </Flex>
      );
    }
    case "numberRange": {
      const [minKey, maxKey] = filterStateKeys(def);
      return (
        <Flex gap={8}>
          <InputNumber
            size="small"
            style={{ width: "100%" }}
            aria-label={`${label} min`}
            value={numberValue(extra[minKey!])}
            onChange={(value) => setExtra(minKey!, value ?? "")}
          />
          <InputNumber
            size="small"
            style={{ width: "100%" }}
            aria-label={`${label} max`}
            value={numberValue(extra[maxKey!])}
            onChange={(value) => setExtra(maxKey!, value ?? "")}
          />
        </Flex>
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
          <FilterControl
            def={def}
            extra={source.extra}
            setExtra={source.setExtra}
          />
        </Space>
      ))}
    </Space>
  );
}
