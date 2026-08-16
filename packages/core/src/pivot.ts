/**
 * Pivot tables — `@adapttable/core/pivot`.
 *
 * A separate entry point, so a table that never pivots never downloads the
 * engine. Import it and you get the calculation; the rendering stays with
 * whichever adapter you are using.
 *
 * ```tsx
 * import { pivot } from "@adapttable/core/pivot";
 *
 * const result = pivot(rows, {
 *   rows: ["region", "team"],
 *   columns: ["quarter"],
 *   measures: [{ key: "amount", agg: "sum" }],
 * });
 * ```
 */
export {
  assignField,
  availableFields,
  EMPTY_PIVOT_CONFIG,
  isPivotReady,
  measureLabel,
  moveField,
  PIVOT_ZONES,
  type PivotField,
  type PivotZone,
  removeField,
  setMeasureAgg,
} from "./pivot/pivotConfigModel";
export {
  pivot,
  PIVOT_BLANK,
  PIVOT_GRAND_TOTAL_KEY,
  type PivotColumnLeaf,
  type PivotColumnNode,
  type PivotConfig,
  type PivotMeasure,
  type PivotOptions,
  type PivotResult,
  type PivotRow,
  type PivotRowKind,
} from "./pivot/pivotModel";
export {
  deserializePivot,
  serializePivot,
  usePivotUrlState,
  type UsePivotUrlStateOptions,
  type UsePivotUrlStateResult,
} from "./pivot/pivotUrlState";
export {
  type QueryPivotPage,
  type QueryPivotRow,
  type ServerPivotOptions,
  serverPivotResult,
} from "./pivot/serverPivot";
