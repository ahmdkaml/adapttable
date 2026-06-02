import type { ExtraFilters, FilterValue } from "../types";

/** Numeric comparison operators for count/usage filters. */
export const COUNT_OPERATORS = [
  "eq",
  "gte",
  "lte",
  "gt",
  "lt",
  "between",
] as const;

/** Numeric comparison operator. */
export type CountOperator = (typeof COUNT_OPERATORS)[number];

/** State for one operator-driven count filter. */
export interface CountFilterState {
  op?: CountOperator;
  value?: number;
  from?: number;
  to?: number;
}

/** Symbols used in compact chip labels. */
export const COUNT_OPERATOR_SYMBOL: Record<CountOperator, string> = {
  eq: "=",
  gte: "≥",
  lte: "≤",
  gt: ">",
  lt: "<",
  between: "↔",
};

const OP_SUFFIX = "Op";
const VALUE_SUFFIX = "Value";
const FROM_SUFFIX = "From";
const TO_SUFFIX = "To";

const opKey = (bucket: string) => `${bucket}${OP_SUFFIX}`;
const valueKey = (bucket: string) => `${bucket}${VALUE_SUFFIX}`;
const fromKey = (bucket: string) => `${bucket}${FROM_SUFFIX}`;
const toKey = (bucket: string) => `${bucket}${TO_SUFFIX}`;

function isNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Whether a count-filter state is complete enough to affect a query. */
export function isCountFilterComplete(state: CountFilterState): boolean {
  if (!state.op) return false;
  if (state.op === "between") {
    return isNumber(state.from) && isNumber(state.to);
  }
  return isNumber(state.value);
}

/** Convert a state update to URL-extra values for one bucket. */
export function countFilterExtra(
  bucket: string,
  state: CountFilterState
): ExtraFilters {
  return {
    [opKey(bucket)]: state.op,
    [valueKey(bucket)]: state.op === "between" ? undefined : state.value,
    [fromKey(bucket)]: state.op === "between" ? state.from : undefined,
    [toKey(bucket)]: state.op === "between" ? state.to : undefined,
  };
}

/** URL-extra update that clears every value for one bucket. */
export function clearCountFilterExtra(bucket: string): ExtraFilters {
  return {
    [opKey(bucket)]: undefined,
    [valueKey(bucket)]: undefined,
    [fromKey(bucket)]: undefined,
    [toKey(bucket)]: undefined,
  };
}

/** Rehydrate one bucket's count-filter state from an extra-filter bag. */
export function countFilterStateFromExtra(
  bucket: string,
  extra: Readonly<Record<string, FilterValue>>
): CountFilterState {
  return {
    op: extra[opKey(bucket)] as CountOperator | undefined,
    value: extra[valueKey(bucket)] as number | undefined,
    from: extra[fromKey(bucket)] as number | undefined,
    to: extra[toKey(bucket)] as number | undefined,
  };
}

/**
 * Remove incomplete count filters from backend params while preserving any
 * unrelated params. This lets a UI keep partial state in the URL without
 * sending invalid operator/value pairs to an API.
 */
export function sanitizeCountFilterParams<P extends Record<string, unknown>>(
  params: P,
  buckets: readonly string[]
): P {
  const out: Record<string, unknown> = { ...params };
  for (const bucket of buckets) {
    const state: CountFilterState = {
      op: out[opKey(bucket)] as CountOperator | undefined,
      value: out[valueKey(bucket)] as number | undefined,
      from: out[fromKey(bucket)] as number | undefined,
      to: out[toKey(bucket)] as number | undefined,
    };
    if (isCountFilterComplete(state)) continue;
    delete out[opKey(bucket)];
    delete out[valueKey(bucket)];
    delete out[fromKey(bucket)];
    delete out[toKey(bucket)];
  }
  return out as P;
}

/** Build a compact chip label for a complete count filter. */
export function countFilterChipLabel(
  label: string,
  state: CountFilterState
): string | undefined {
  if (!isCountFilterComplete(state) || !state.op) return undefined;
  if (state.op === "between") {
    return `${label}: ${state.from}-${state.to}`;
  }
  return `${label} ${COUNT_OPERATOR_SYMBOL[state.op]} ${state.value}`;
}
