/**
 * Turning user-typed formulas into columns.
 *
 * Two things make this more than a `map` over the specs.
 *
 * A formula may reference another formula column, so evaluating one can mean
 * evaluating others first — and a user can write `a = b + 1` and `b = a + 1`
 * without meaning to. Those cycles are found once, up front, and every key in
 * one evaluates to `#CYCLE!` rather than recursing until the stack gives out.
 *
 * And a formula that will not parse is reported, not thrown. A formula bar
 * has to show something useful while someone is still typing, and half a
 * formula is the normal state of one being written.
 */
import type { ColumnDef } from "../types";
import {
  evaluateFormula,
  FORMULA_ERRORS,
  formulaDisplay,
  formulaError,
  formulaSortValue,
  type FormulaValue,
  toFormulaValue,
} from "./evaluate";
import { formulaRefs, parseFormula, type ParseResult } from "./parse";

/** One user-typed formula column. */
export interface FormulaColumnSpec {
  /** Column key — also the name other formulas reference it by. */
  key: string;
  /** Header caption. Defaults to the key. */
  header?: string;
  /** The formula text, as the user typed it. A leading `=` is fine. */
  formula: string;
  /** Format the result for display. Errors are never handed to it. */
  format?: (value: FormulaValue) => string;
}

/** What {@link buildFormulaColumns} reports back. */
export interface FormulaColumnsResult<TRow> {
  /** The columns, ready to concatenate with the declared ones. */
  columns: readonly ColumnDef<TRow>[];
  /** Formulas that would not parse, by key, with the parser's message. */
  errors: Readonly<Record<string, string>>;
  /** Keys that take part in a dependency cycle, if any. */
  cycles: readonly string[];
}

/**
 * Every key that can reach itself through the reference graph.
 *
 * Depth-first with the current path: a key found while it is still on that
 * path is in a cycle, and so is everything behind it on the path.
 */
function findCycles(deps: ReadonlyMap<string, readonly string[]>): string[] {
  const cyclic = new Set<string>();
  const done = new Set<string>();

  const walk = (key: string, path: string[]): void => {
    const at = path.indexOf(key);
    if (at >= 0) {
      for (const member of path.slice(at)) cyclic.add(member);
      return;
    }
    if (done.has(key)) return;
    path.push(key);
    for (const next of deps.get(key) ?? []) walk(next, path);
    path.pop();
    done.add(key);
  };

  for (const key of deps.keys()) walk(key, []);
  return [...cyclic];
}

/**
 * Build columns from formulas.
 *
 * @typeParam TRow - The row type.
 * @param specs - The formulas, in the order the columns should appear.
 * @returns The columns, plus what would not parse and what forms a cycle.
 */
export function buildFormulaColumns<TRow extends object>(
  specs: readonly FormulaColumnSpec[]
): FormulaColumnsResult<TRow> {
  const parsed = new Map<string, ParseResult>();
  const deps = new Map<string, string[]>();
  const errors: Record<string, string> = {};

  for (const spec of specs) {
    const result = parseFormula(spec.formula);
    parsed.set(spec.key, result);
    if (result.ok && result.node) {
      deps.set(spec.key, formulaRefs(result.node));
    } else {
      errors[spec.key] = result.message ?? "could not be parsed";
      deps.set(spec.key, []);
    }
  }

  // Only formula columns can take part in a cycle: a declared column is a
  // leaf, because its value does not depend on anything the user typed.
  const formulaKeys = new Set(specs.map((spec) => spec.key));
  const graph = new Map<string, string[]>();
  for (const [key, refs] of deps) {
    graph.set(
      key,
      refs.filter((ref) => formulaKeys.has(ref))
    );
  }
  const cycles = findCycles(graph);
  const cyclic = new Set(cycles);

  // Reading another formula column's value is safe precisely because the
  // cycles are already known and short-circuited here.
  const valueOf = (row: TRow, key: string, seen: Set<string>): FormulaValue => {
    if (cyclic.has(key) || seen.has(key)) {
      return formulaError(FORMULA_ERRORS.cycle);
    }
    const result = parsed.get(key);
    if (!result) return toFormulaValue((row as Record<string, unknown>)[key]);
    if (!result.ok || !result.node) {
      return formulaError(FORMULA_ERRORS.syntax);
    }
    const next = new Set(seen).add(key);
    return evaluateFormula(result.node, (ref) => {
      if (formulaKeys.has(ref)) return valueOf(row, ref, next);
      const raw = (row as Record<string, unknown>)[ref];
      return raw === undefined ? undefined : toFormulaValue(raw);
    });
  };

  const columns = specs.map((spec): ColumnDef<TRow> => {
    // Keyed by the row object, so a row that leaves the page takes its memo
    // with it and a long-lived table cannot grow a cache it never releases.
    const memos = new WeakMap<TRow, { deps: unknown[]; value: FormulaValue }>();
    const refs = deps.get(spec.key) ?? [];

    const cached = (row: TRow): FormulaValue => {
      // Every column the formula reads, so the memo drops when any of them
      // changes — the same rule a hand-written computed column follows.
      const current = refs.map((ref) => (row as Record<string, unknown>)[ref]);
      const memo = memos.get(row);
      if (
        memo?.deps.length === current.length &&
        memo.deps.every((dep, i) => Object.is(dep, current[i]))
      ) {
        return memo.value;
      }
      const value = valueOf(row, spec.key, new Set());
      memos.set(row, { deps: current, value });
      return value;
    };

    return {
      key: spec.key,
      header: spec.header ?? spec.key,
      accessor: (row) => {
        const value = cached(row);
        // An error shows as itself: formatting it as currency or a
        // percentage would hide which cell went wrong.
        if (value.kind === "error") return value.code;
        return spec.format ? spec.format(value) : formulaDisplay(value);
      },
      // Sorting compares the value, never the formatting — and a tagged
      // value has to be projected onto something comparable first.
      sortValue: (row) => formulaSortValue(cached(row)),
      exportValue: (row) => formulaDisplay(cached(row)),
    };
  });

  return { columns, errors, cycles };
}
