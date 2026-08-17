/**
 * The pivot configuration as a URL parameter — the encoding on its own,
 * without the hook that keeps it in sync.
 *
 * A pivot is the most expensive table state there is to rebuild by hand —
 * two axes, an order on each, and a measure list — which makes it the state
 * most worth putting in a link. It sits alongside sort, filters and column
 * layout for exactly the reason those do.
 *
 * The serialization is compact and readable rather than JSON-in-a-parameter:
 * `pivot=rows:region,team;cols:quarter;sum:amount`. A URL someone might read
 * or hand-edit should look like something, and the round trip is tested
 * rather than assumed.
 *
 * Custom aggregators cannot be serialized — a function has no URL form. A
 * configuration carrying one keeps working in memory and simply does not
 * write that measure to the URL, because a link that silently turned a custom
 * aggregation into `sum` would be worse than a link that omits it.
 *
 * The codec lives apart from {@link usePivotUrlState} because the two ends of
 * that link do not run in the same place: the table writes the parameter in a
 * browser, and a route handler reads it in Node. Keeping the reading half free
 * of React is what lets `@adapttable/core/query` — and `@adapttable/server`
 * through it — decode the same string a backend never renders.
 */
import type { AggregateName } from "../aggregate/aggregate";
import { EMPTY_PIVOT_CONFIG } from "./pivotConfigModel";
import type { PivotConfig, PivotMeasure } from "./pivotModel";

const AGGREGATIONS: readonly AggregateName[] = [
  "sum",
  "avg",
  "count",
  "min",
  "max",
];

/** Whether a string names a built-in aggregation. */
function isAggregateName(value: string): value is AggregateName {
  return (AGGREGATIONS as readonly string[]).includes(value);
}

/**
 * Write a configuration as a URL parameter value.
 *
 * @param config - The configuration to serialize.
 * @returns The parameter value, or `""` when there is nothing to say.
 */
export function serializePivot(config: PivotConfig): string {
  const parts: string[] = [];
  if (config.rows.length > 0) parts.push(`rows:${config.rows.join(",")}`);
  if (config.columns.length > 0) parts.push(`cols:${config.columns.join(",")}`);
  for (const measure of config.measures) {
    // A function has no URL form. Omitting it beats writing `sum` and
    // quietly changing what the link computes.
    if (typeof measure.agg !== "string") continue;
    parts.push(`${measure.agg}:${measure.key}`);
  }
  return parts.join(";");
}

/**
 * Read a configuration back from a URL parameter value.
 *
 * Unknown segments are ignored rather than throwing: a URL is user input,
 * and a hand-edited one should degrade to a simpler pivot instead of an
 * error page.
 *
 * @param raw - The parameter value.
 * @returns The configuration it describes.
 */
export function deserializePivot(raw: string | null): PivotConfig {
  if (!raw) return EMPTY_PIVOT_CONFIG;
  let rows: readonly string[] = [];
  let columns: readonly string[] = [];
  const measures: PivotMeasure[] = [];
  for (const part of raw.split(";")) {
    const at = part.indexOf(":");
    if (at < 0) continue;
    const head = part.slice(0, at);
    const body = part.slice(at + 1);
    if (body === "") continue;
    if (head === "rows") rows = body.split(",");
    else if (head === "cols") columns = body.split(",");
    else if (isAggregateName(head)) measures.push({ key: body, agg: head });
  }
  return { rows, columns, measures };
}
