/**
 * Kit-agnostic AND/OR filter-tree builder. Native controls on purpose:
 * kit Select portals fight the filter popover (antd already went native
 * on the flat form for the same reason). Adapters supply class names.
 */
import type { ChangeEvent, ReactNode } from "react";

import { resolveLabels } from "../labels";
import type { QueryCondition, QueryFilterGroup } from "../source/queryContract";
import { isFilterGroup } from "../source/queryContract";
import type { TableSource } from "../source/TableSource";
import type { TableLabels } from "../types";
import { type FilterDef, filterLabel, type FilterType } from "./filterDefs";
import { filterOpLabel } from "./filterForm";
import {
  addFilterTreeCondition,
  addFilterTreeGroup,
  emptyFilterTree,
  removeFilterTreeNode,
  replaceFilterTreeNode,
  setFilterTreeCombinator,
} from "./filterTreeMutations";
import {
  DATE_OP_LABEL_KEYS,
  DATE_OPS,
  isBetweenFilterOp,
  isListFilterOp,
  isValuelessFilterOp,
  NUMBER_OP_LABEL_KEYS,
  NUMBER_OPS,
  TEXT_OP_LABEL_KEYS,
  TEXT_OPS,
} from "./operators";
import {
  joinRelativeToken,
  RELATIVE_PRESET_LABEL_KEYS,
  RELATIVE_PRESETS,
  type RelativePreset,
  splitRelativeToken,
} from "./relativeDates";

/** Class hooks the unstyled adapter maps onto `DataTableClassNames`. */
export interface FilterTreeClassNames {
  filterTree?: string;
  filterTreeGroup?: string;
  filterTreeCondition?: string;
  filterTreeActions?: string;
  filterTreeRemove?: string;
  filtersForm?: string;
  filterField?: string;
  filterLabel?: string;
  filterInput?: string;
  filterSelect?: string;
  filterOperator?: string;
}

/** Props for {@link FilterTreeBuilder}. */
export interface FilterTreeBuilderProps<TRow> {
  readonly defs: readonly FilterDef<TRow>[];
  readonly source: Pick<TableSource<TRow>, "filterTree" | "setFilterTree">;
  readonly labels?: TableLabels;
  readonly classNames?: FilterTreeClassNames;
}

function defaultOp(type: FilterType): string {
  if (type === "text") return "contains";
  if (type === "numberRange") return "gte";
  if (type === "dateRange") return "on";
  return "eq";
}

function opsFor(type: FilterType): readonly string[] {
  if (type === "text") return TEXT_OPS;
  if (type === "numberRange") return NUMBER_OPS;
  if (type === "dateRange") return DATE_OPS;
  return ["eq"];
}

function opLabelKey(
  type: FilterType,
  op: string
): keyof TableLabels | undefined {
  if (type === "text" && op in TEXT_OP_LABEL_KEYS) {
    return TEXT_OP_LABEL_KEYS[op as keyof typeof TEXT_OP_LABEL_KEYS];
  }
  if (type === "numberRange" && op in NUMBER_OP_LABEL_KEYS) {
    return NUMBER_OP_LABEL_KEYS[op as keyof typeof NUMBER_OP_LABEL_KEYS];
  }
  if (type === "dateRange" && op in DATE_OP_LABEL_KEYS) {
    return DATE_OP_LABEL_KEYS[op as keyof typeof DATE_OP_LABEL_KEYS];
  }
  return undefined;
}

function newCondition<TRow>(def: FilterDef<TRow>): QueryCondition {
  return { key: def.key, op: defaultOp(def.type) };
}

function inputTypeFor(
  type: FilterType,
  op: string
): "text" | "number" | "date" {
  if (op === "relative" || isListFilterOp(op)) return "text";
  if (type === "numberRange") return "number";
  if (type === "dateRange") return "date";
  return "text";
}

function asText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return "";
}

function pairOf(value: unknown): { a: string; b: string } {
  if (Array.isArray(value)) {
    return { a: asText(value[0]), b: asText(value[1]) };
  }
  return { a: asText(value), b: "" };
}

function NativeSelect({
  label,
  value,
  className,
  fieldClassName,
  labelClassName,
  part,
  onChange,
  children,
}: Readonly<{
  label: string;
  value: string;
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;
  part: string;
  onChange: (value: string) => void;
  children: ReactNode;
}>) {
  return (
    <label data-adapttable-part="filter-field" className={fieldClassName}>
      <span data-adapttable-part="filter-label" className={labelClassName}>
        {label}
      </span>
      <select
        aria-label={label}
        data-adapttable-part={part}
        className={className}
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(event.target.value)
        }
      >
        {children}
      </select>
    </label>
  );
}

function NativeInput({
  label,
  value,
  type,
  className,
  fieldClassName,
  labelClassName,
  onChange,
}: Readonly<{
  label: string;
  value: string;
  type: "text" | "number" | "date";
  className?: string;
  fieldClassName?: string;
  labelClassName?: string;
  onChange: (value: string) => void;
}>) {
  return (
    <label data-adapttable-part="filter-field" className={fieldClassName}>
      <span data-adapttable-part="filter-label" className={labelClassName}>
        {label}
      </span>
      <input
        aria-label={label}
        data-adapttable-part="filter-input"
        className={className}
        type={type}
        value={value}
        onChange={(event: ChangeEvent<HTMLInputElement>) =>
          onChange(event.target.value)
        }
      />
    </label>
  );
}

function ConditionValue<TRow>({
  def,
  condition,
  labels,
  classNames,
  onChange,
}: Readonly<{
  def: FilterDef<TRow>;
  condition: QueryCondition;
  labels: Required<TableLabels>;
  classNames: FilterTreeClassNames;
  onChange: (value: unknown) => void;
}>) {
  if (isValuelessFilterOp(condition.op)) return null;
  if (def.type === "boolean") {
    const choice =
      condition.value === false || condition.value === "false"
        ? "false"
        : "true";
    return (
      <NativeSelect
        label={labels.value}
        value={choice}
        part="filter-select"
        className={classNames.filterSelect}
        fieldClassName={classNames.filterField}
        labelClassName={classNames.filterLabel}
        onChange={(next) => onChange(next === "true")}
      >
        <option value="true">{labels.boolTrue}</option>
        <option value="false">{labels.boolFalse}</option>
      </NativeSelect>
    );
  }
  if (condition.op === "relative") {
    const token =
      typeof condition.value === "string" ? condition.value : "today";
    const { preset, n } = splitRelativeToken(token);
    const counted = preset === "last" || preset === "next";
    return (
      <>
        <NativeSelect
          label={labels.opRelative}
          value={preset}
          part="filter-select"
          className={classNames.filterSelect}
          fieldClassName={classNames.filterField}
          labelClassName={classNames.filterLabel}
          onChange={(next) =>
            onChange(joinRelativeToken(next as RelativePreset, n))
          }
        >
          {RELATIVE_PRESETS.map((item) => (
            <option key={item} value={item}>
              {labels[RELATIVE_PRESET_LABEL_KEYS[item]]}
            </option>
          ))}
        </NativeSelect>
        {counted ? (
          <NativeInput
            label="N"
            type="number"
            value={String(n)}
            className={classNames.filterInput}
            fieldClassName={classNames.filterField}
            labelClassName={classNames.filterLabel}
            onChange={(next) =>
              onChange(joinRelativeToken(preset, Number(next) || 1))
            }
          />
        ) : null}
      </>
    );
  }
  const type = inputTypeFor(def.type, condition.op);
  if (isBetweenFilterOp(condition.op)) {
    const { a, b } = pairOf(condition.value);
    return (
      <>
        <NativeInput
          label={labels.from}
          type={type}
          value={a}
          className={classNames.filterInput}
          fieldClassName={classNames.filterField}
          labelClassName={classNames.filterLabel}
          onChange={(next) => onChange([next, b])}
        />
        <NativeInput
          label={labels.to}
          type={type}
          value={b}
          className={classNames.filterInput}
          fieldClassName={classNames.filterField}
          labelClassName={classNames.filterLabel}
          onChange={(next) => onChange([a, next])}
        />
      </>
    );
  }
  const text = Array.isArray(condition.value)
    ? condition.value.map(asText).join(",")
    : asText(condition.value);
  return (
    <NativeInput
      label={labels.value}
      type={type}
      value={text}
      className={classNames.filterInput}
      fieldClassName={classNames.filterField}
      labelClassName={classNames.filterLabel}
      onChange={(next) =>
        onChange(isListFilterOp(condition.op) ? next.split(",") : next)
      }
    />
  );
}

function ConditionRow<TRow>({
  condition,
  path,
  defs,
  labels,
  classNames,
  onReplace,
  onRemove,
}: Readonly<{
  condition: QueryCondition;
  path: readonly number[];
  defs: readonly FilterDef<TRow>[];
  labels: Required<TableLabels>;
  classNames: FilterTreeClassNames;
  onReplace: (path: readonly number[], next: QueryCondition) => void;
  onRemove: (path: readonly number[]) => void;
}>) {
  const def = defs.find((item) => item.key === condition.key) ?? defs[0];
  if (!def) return null;
  const ops = opsFor(def.type);
  return (
    <div
      data-adapttable-part="filter-tree-condition"
      className={classNames.filterTreeCondition}
    >
      <NativeSelect
        label={labels.filterField}
        value={def.key}
        part="filter-select"
        className={classNames.filterSelect}
        fieldClassName={classNames.filterField}
        labelClassName={classNames.filterLabel}
        onChange={(key) => {
          const next = defs.find((item) => item.key === key);
          if (next) onReplace(path, newCondition(next));
        }}
      >
        {defs.map((item) => (
          <option key={item.key} value={item.key}>
            {filterLabel(item)}
          </option>
        ))}
      </NativeSelect>
      {ops.length > 1 ? (
        <NativeSelect
          label={labels.operator}
          value={condition.op}
          part="filter-operator"
          className={classNames.filterOperator}
          fieldClassName={classNames.filterField}
          labelClassName={classNames.filterLabel}
          onChange={(op) =>
            onReplace(path, { ...condition, op, value: undefined })
          }
        >
          {ops.map((op) => {
            const key = opLabelKey(def.type, op);
            return (
              <option key={op} value={op}>
                {key ? filterOpLabel(labels, key) : op}
              </option>
            );
          })}
        </NativeSelect>
      ) : null}
      <ConditionValue
        def={def}
        condition={condition}
        labels={labels}
        classNames={classNames}
        onChange={(value) => onReplace(path, { ...condition, value })}
      />
      <button
        type="button"
        data-adapttable-part="filter-tree-remove"
        className={classNames.filterTreeRemove}
        onClick={() => onRemove(path)}
      >
        {labels.filterRemoveCondition}
      </button>
    </div>
  );
}

function GroupActions({
  labels,
  classNames,
  onAddCondition,
  onAddGroup,
}: Readonly<{
  labels: Required<TableLabels>;
  classNames: FilterTreeClassNames;
  onAddCondition: () => void;
  onAddGroup: () => void;
}>) {
  return (
    <div
      data-adapttable-part="filter-tree-actions"
      className={classNames.filterTreeActions}
    >
      <button type="button" onClick={onAddCondition}>
        {labels.filterAddCondition}
      </button>
      <button type="button" onClick={onAddGroup}>
        {labels.filterAddGroup}
      </button>
    </div>
  );
}

function GroupView<TRow>({
  group,
  path,
  defs,
  labels,
  classNames,
  onCombinator,
  onAddCondition,
  onAddGroup,
  onReplace,
  onRemove,
}: Readonly<{
  group: QueryFilterGroup;
  path: readonly number[];
  defs: readonly FilterDef<TRow>[];
  labels: Required<TableLabels>;
  classNames: FilterTreeClassNames;
  onCombinator: (path: readonly number[], next: "and" | "or") => void;
  onAddCondition: (path: readonly number[]) => void;
  onAddGroup: (path: readonly number[]) => void;
  onReplace: (path: readonly number[], next: QueryCondition) => void;
  onRemove: (path: readonly number[]) => void;
}>) {
  return (
    <fieldset
      data-adapttable-part="filter-tree-group"
      className={classNames.filterTreeGroup}
    >
      <legend>
        <NativeSelect
          label={labels.filterTree}
          value={group.combinator}
          part="filter-operator"
          className={classNames.filterOperator}
          fieldClassName={classNames.filterField}
          labelClassName={classNames.filterLabel}
          onChange={(next) => onCombinator(path, next === "or" ? "or" : "and")}
        >
          <option value="and">{labels.filterCombinatorAnd}</option>
          <option value="or">{labels.filterCombinatorOr}</option>
        </NativeSelect>
        {path.length > 0 ? (
          <button
            type="button"
            data-adapttable-part="filter-tree-remove"
            className={classNames.filterTreeRemove}
            onClick={() => onRemove(path)}
          >
            {labels.filterRemoveGroup}
          </button>
        ) : null}
      </legend>
      {group.conditions.map((node, index) => {
        const childPath = [...path, index];
        if (isFilterGroup(node)) {
          return (
            <GroupView
              key={childPath.join(".")}
              group={node}
              path={childPath}
              defs={defs}
              labels={labels}
              classNames={classNames}
              onCombinator={onCombinator}
              onAddCondition={onAddCondition}
              onAddGroup={onAddGroup}
              onReplace={onReplace}
              onRemove={onRemove}
            />
          );
        }
        return (
          <ConditionRow
            key={childPath.join(".")}
            condition={node}
            path={childPath}
            defs={defs}
            labels={labels}
            classNames={classNames}
            onReplace={onReplace}
            onRemove={onRemove}
          />
        );
      })}
      <GroupActions
        labels={labels}
        classNames={classNames}
        onAddCondition={() => onAddCondition(path)}
        onAddGroup={() => onAddGroup(path)}
      />
    </fieldset>
  );
}

/**
 * Recursive AND/OR builder over {@link QueryFilterGroup}. Writes the
 * versioned `ft` param through `source.setFilterTree`.
 */
export function FilterTreeBuilder<TRow>({
  defs,
  source,
  labels: labelOverrides,
  classNames = {},
}: Readonly<FilterTreeBuilderProps<TRow>>) {
  const labels = resolveLabels(labelOverrides);
  const tree = source.filterTree;
  const commit = source.setFilterTree;
  const first = defs[0];
  if (!commit || !first || defs.length === 0) return null;

  const onAddCondition = (path: readonly number[]) => {
    commit(addFilterTreeCondition(tree, path, newCondition(first)));
  };
  const onAddGroup = (path: readonly number[]) => {
    commit(addFilterTreeGroup(tree ?? emptyFilterTree(), path));
  };

  return (
    <div data-adapttable-part="filter-tree" className={classNames.filterTree}>
      {tree ? (
        <GroupView
          group={tree}
          path={[]}
          defs={defs}
          labels={labels}
          classNames={classNames}
          onCombinator={(path, next) =>
            commit(setFilterTreeCombinator(tree, path, next))
          }
          onAddCondition={onAddCondition}
          onAddGroup={onAddGroup}
          onReplace={(path, next) =>
            commit(replaceFilterTreeNode(tree, path, next))
          }
          onRemove={(path) => commit(removeFilterTreeNode(tree, path))}
        />
      ) : (
        <GroupActions
          labels={labels}
          classNames={classNames}
          onAddCondition={() => onAddCondition([])}
          onAddGroup={() => onAddGroup([])}
        />
      )}
    </div>
  );
}
