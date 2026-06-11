import type { ExtraFilters, FilterValue } from "../types";

/**
 * Operator choices for the auto-built range widgets (`numberRange` /
 * `dateRange`). The widget is operator-first — pick the comparison, then
 * fill ONE value (or two for `between`) — but the persisted state stays
 * the inclusive `Min`/`Max` (`From`/`To`) pair, so URLs, chips, predicates
 * and the server-tier query contract are unchanged.
 */
export const RANGE_OPS = ["eq", "gte", "lte", "between"] as const;

/** One range-widget comparison operator. */
export type RangeOp = (typeof RANGE_OPS)[number];

/** The widget's view of a range: an operator plus its bound(s). */
export interface RangeWidgetState {
  /** Selected comparison, or `undefined` while nothing is chosen. */
  op: RangeOp | undefined;
  /** The single value (`eq`/`gte`/`lte`) or the lower bound (`between`). */
  a: string;
  /** The upper bound (`between` only). */
  b: string;
}

const text = (value: FilterValue | undefined): string =>
  value == null ? "" : String(value);

/**
 * Derive the widget state from the persisted pair: both bounds equal →
 * `eq`, both present → `between`, lower only → `gte`, upper only → `lte`,
 * none → no operator yet.
 */
export function readRangeWidget(
  extra: ExtraFilters,
  lowKey: string,
  highKey: string
): RangeWidgetState {
  const low = text(extra[lowKey]);
  const high = text(extra[highKey]);
  if (low !== "" && high !== "") {
    return low === high
      ? { op: "eq", a: low, b: "" }
      : { op: "between", a: low, b: high };
  }
  if (low !== "") return { op: "gte", a: low, b: "" };
  if (high !== "") return { op: "lte", a: "", b: high };
  return { op: undefined, a: "", b: "" };
}

/**
 * Convert a widget interaction back to the persisted pair. Empty values
 * clear their keys, so half-filled widgets never leak stale bounds.
 */
export function writeRangeWidget(
  op: RangeOp | undefined,
  a: string,
  b: string,
  lowKey: string,
  highKey: string
): ExtraFilters {
  const value = (raw: string): FilterValue => (raw === "" ? undefined : raw);
  switch (op) {
    case "eq":
      return { [lowKey]: value(a), [highKey]: value(a) };
    case "gte":
      return { [lowKey]: value(a), [highKey]: undefined };
    case "lte":
      return { [lowKey]: undefined, [highKey]: value(a) };
    case "between":
      return { [lowKey]: value(a), [highKey]: value(b) };
    default:
      return { [lowKey]: undefined, [highKey]: undefined };
  }
}

/** Label keys for each operator, per widget flavour (numbers vs dates). */
export const RANGE_OP_LABEL_KEYS = {
  number: {
    eq: "opEqual",
    gte: "opAtLeast",
    lte: "opAtMost",
    between: "opBetween",
  },
  date: {
    eq: "opOn",
    gte: "opOnOrAfter",
    lte: "opOnOrBefore",
    between: "opBetween",
  },
} as const;
