/**
 * AND/OR filter tree — the engine behind advanced filters (#278).
 * The URL and Saved Views store a versioned encoding; the frontend
 * predicate and the server query both read the same {@link QueryFilterGroup}.
 * The builder UI is #279; this file is the evaluator.
 */
import type { QueryCondition, QueryFilterGroup } from "../source/queryContract";
import { isFilterGroup } from "../source/queryContract";
import type { ExtraFilters } from "../types";
import { type FilterDef, filterPredicate, RANGE_SUFFIXES } from "./filterDefs";
import { isActiveFilterTree } from "./filterTreeCodec";
import { filterOpKey } from "./operators";

export {
  FILTER_TREE_PARAM,
  FILTER_TREE_VERSION,
  isActiveFilterTree,
  parseFilterTree,
  serializeFilterTree,
} from "./filterTreeCodec";

function asScalar(value: unknown): string | undefined {
  if (value == null) return undefined;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return undefined;
}

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String);
  const one = asScalar(value);
  return one == null ? [] : [one];
}

function pairValue(value: unknown): {
  a: string | undefined;
  b: string | undefined;
} {
  if (Array.isArray(value)) {
    return { a: asScalar(value[0]), b: asScalar(value[1]) };
  }
  return { a: asScalar(value), b: undefined };
}

/**
 * Project one tree condition onto the extra-filter bag the existing
 * per-def predicate already understands.
 */
export function conditionToExtra<TRow>(
  def: FilterDef<TRow>,
  condition: QueryCondition
): ExtraFilters {
  const opKey = filterOpKey(def.key);
  const op = condition.op;
  if (def.type === "dateRange" || def.type === "numberRange") {
    const suffixes = RANGE_SUFFIXES[def.type];
    const lowKey = def.key + suffixes.start;
    const highKey = def.key + suffixes.end;
    if (op === "empty" || op === "notEmpty") {
      return { [opKey]: op };
    }
    if (op === "in" || op === "notIn") {
      const list = asList(condition.value);
      return { [def.key]: list.length > 0 ? list : undefined, [opKey]: op };
    }
    if (op === "between") {
      const { a, b } = pairValue(condition.value);
      return { [lowKey]: a, [highKey]: b, [opKey]: op };
    }
    if (op === "before" || op === "lte" || op === "lt") {
      return { [highKey]: asScalar(condition.value), [opKey]: op };
    }
    return { [lowKey]: asScalar(condition.value), [opKey]: op };
  }
  return {
    [def.key]: asScalar(condition.value),
    [opKey]: op,
  };
}

function matchCondition<TRow>(
  row: TRow,
  condition: QueryCondition,
  defs: readonly FilterDef<TRow>[]
): boolean {
  const def = defs.find((item) => item.key === condition.key);
  if (!def) return true;
  return filterPredicate(def)(row, conditionToExtra(def, condition));
}

/**
 * Evaluate a tree against one row. An empty / missing tree matches
 * every row. Unknown condition keys match (stale links do not hide data).
 */
export function evaluateFilterTree<TRow>(
  tree: QueryFilterGroup | undefined,
  row: TRow,
  defs: readonly FilterDef<TRow>[]
): boolean {
  if (!isActiveFilterTree(tree)) return true;
  const results = tree.conditions.map((node) =>
    isFilterGroup(node)
      ? evaluateFilterTree(node, row, defs)
      : matchCondition(row, node, defs)
  );
  return tree.combinator === "and"
    ? results.every(Boolean)
    : results.some(Boolean);
}
