import { useState } from "react";

import type { TableSource } from "../source/TableSource";
import type { FilterValue } from "../types";
import type { FilterDef } from "./filterDefs";
import { filterLabel, filterStateKeys } from "./filterDefs";
import type { RangeOp } from "./rangeWidget";
import {
  RANGE_OP_LABEL_KEYS,
  readRangeWidget,
  writeRangeWidget,
} from "./rangeWidget";

/**
 * The slice of the table source the auto-built filter form reads and writes:
 * the extra-filter bag and its single/bulk setters. Every batteries-included
 * adapter renders its own kit controls over this same contract.
 */
export type FilterFormSource<TRow> = Pick<
  TableSource<TRow>,
  "extra" | "setExtra" | "setExtras"
>;

/** A scalar filter value as input text ("" when unset; numbers stringify). */
export function scalarFilterText(value: FilterValue): string {
  return value == null ? "" : String(value);
}

/** A multi-select value as a list — tolerating a scalar from the URL. */
export function listFilterValues(value: FilterValue): string[] {
  if (Array.isArray(value)) return [...value];
  return value == null || value === "" ? [] : [String(value)];
}

/** Per-operator label keys for one widget flavour (numbers or dates). */
export type RangeOpLabelKeys =
  | (typeof RANGE_OP_LABEL_KEYS)["number"]
  | (typeof RANGE_OP_LABEL_KEYS)["date"];

/** Computed state + writers driving an operator-first range field. */
export interface RangeFieldWidget {
  /** The field's display label. */
  label: string;
  /** Per-operator label keys for the current flavour (number vs date). */
  opLabelKeys: RangeOpLabelKeys;
  /** Native input `type` for the bound inputs. */
  inputType: "date" | "number";
  /** The selected operator, or `undefined` until one is chosen. */
  op: RangeOp | undefined;
  /** Set the operator (UI state, re-seeded from the persisted pair). */
  setOp: (op: RangeOp | undefined) => void;
  /** The single / lower bound as input text. */
  a: string;
  /** The upper bound as input text (`between` only). */
  b: string;
  /** Persist an operator + bound(s) back to the inclusive Min/Max pair. */
  write: (nextOp: RangeOp | undefined, nextA: string, nextB: string) => void;
}

/**
 * The shared, kit-agnostic logic behind an auto-built range filter
 * (`numberRange` / `dateRange`): it seeds the operator from the persisted
 * `Min`/`Max` pair, derives the visible bound(s), and writes interactions back
 * to that pair (emptying an input clears both keys). Adapters render their own
 * kit controls over the returned state, so the operator-first widget behaves
 * identically across kits without each one re-deriving the bounds.
 *
 * @typeParam TRow - The row type.
 * @param def - The range filter definition.
 * @param source - The filter-bag slice (extra + setters).
 * @returns The {@link RangeFieldWidget} state and writers.
 */
export function useRangeFilterWidget<TRow>(
  def: FilterDef<TRow>,
  source: FilterFormSource<TRow>
): RangeFieldWidget {
  const { extra, setExtras } = source;
  const label = filterLabel(def);
  const [lowKey, highKey] = filterStateKeys(def);
  const opLabelKeys =
    RANGE_OP_LABEL_KEYS[def.type === "dateRange" ? "date" : "number"];
  const inputType = def.type === "dateRange" ? "date" : "number";
  const [op, setOp] = useState<RangeOp | undefined>(
    () => readRangeWidget(extra, lowKey!, highKey!).op
  );
  // Bounds derive from the persisted pair, so URL state and chip clears stay
  // the source of truth: "At most" reads the upper key, everything else the
  // lower one ("Equal" wrote both identical), "Between" reads both.
  const a = scalarFilterText(extra[op === "lte" ? highKey! : lowKey!]);
  const b = scalarFilterText(extra[highKey!]);
  const write = (nextOp: RangeOp | undefined, nextA: string, nextB: string) =>
    setExtras(writeRangeWidget(nextOp, nextA, nextB, lowKey!, highKey!));
  return { label, opLabelKeys, inputType, op, setOp, a, b, write };
}
