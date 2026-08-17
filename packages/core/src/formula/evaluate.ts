/**
 * Evaluating a parsed formula against a row.
 *
 * Errors are **values**, not exceptions. A spreadsheet showing `#DIV/0!` in
 * one cell is still a working spreadsheet; a table that threw would lose the
 * other nine hundred rows because one of them had a zero in it. So every
 * failure — a missing column, a division by zero, text where a number was
 * needed — becomes a value that flows through the rest of the expression and
 * lands in the cell.
 *
 * That propagation is the part worth being deliberate about: an error inside
 * `SUM(a, b)` comes out of the `SUM` rather than being counted as zero. A
 * formula that quietly treats a broken input as nothing is how a total ends
 * up wrong in a way nobody notices.
 *
 * Every function here computes into a single `FormulaValue` and returns it
 * once. That reads oddly next to a `switch` with early returns, and it is
 * deliberate: a formula value IS a union, and one exit per function is what
 * keeps that union declared rather than inferred differently on each branch.
 */
import type { FormulaNode } from "./parse";

/** The error values a formula can produce, spelled as a spreadsheet spells them. */
export const FORMULA_ERRORS = {
  /** A column or function the formula names does not exist. */
  name: "#NAME?",
  /** A number was needed and the value was not one. */
  value: "#VALUE!",
  /** Division by zero. */
  divideByZero: "#DIV/0!",
  /** The formula depends on itself, directly or through others. */
  cycle: "#CYCLE!",
  /** The formula could not be parsed at all. */
  syntax: "#ERROR!",
} as const;

/** One of the error strings above. */
export type FormulaError = (typeof FORMULA_ERRORS)[keyof typeof FORMULA_ERRORS];

/**
 * What a formula can evaluate to.
 *
 * The error values are strings, so they already live inside `string` here.
 * {@link isFormulaError} is how you tell one from a cell that happens to
 * contain the text `#DIV/0!` — a guard rather than a wrapper type, because a
 * wrapper is something every `format` callback would have to unwrap.
 */
export type FormulaValue = number | string | boolean | null;

const ERROR_VALUES = new Set<string>(Object.values(FORMULA_ERRORS));

/**
 * Whether a value is one of the error values.
 *
 * @param value - Any formula result.
 * @returns Whether it is an error rather than an answer.
 */
export function isFormulaError(value: unknown): value is FormulaError {
  return typeof value === "string" && ERROR_VALUES.has(value);
}

/** How the evaluator reads a column off the row it was given. */
export type FormulaScope = (key: string) => FormulaValue | undefined;

/**
 * The number a value stands for, or `null` when it does not stand for one.
 *
 * Empty and null are zero, the way a spreadsheet treats a blank cell; text
 * that parses is its number; text that does not is `null`, for the caller to
 * turn into `#VALUE!`.
 */
function numberOf(value: FormulaValue): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value === null || value === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** A number, or the error that explains why it is not one. */
function toNumber(value: FormulaValue): FormulaValue {
  const result: FormulaValue = isFormulaError(value)
    ? value
    : (numberOf(value) ?? FORMULA_ERRORS.value);
  return result;
}

/** Text, for `&` and the string functions. */
function toText(value: FormulaValue): string {
  if (value === null) return "";
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  return String(value);
}

/** The first error among some values, if any — how errors propagate outward. */
function firstError(values: readonly FormulaValue[]): FormulaError | undefined {
  return values.find((value) => isFormulaError(value)) as
    | FormulaError
    | undefined;
}

/**
 * Every number in a list, with non-numbers skipped rather than counted as 0 —
 * a spreadsheet skips a text cell in a SUM. Callers check {@link firstError}
 * FIRST: an error is not a value to skip, it is one to propagate.
 */
function numbersIn(values: readonly FormulaValue[]): number[] {
  const out: number[] = [];
  for (const value of values) {
    const n = numberOf(value);
    if (n !== null && !isFormulaError(value)) out.push(n);
  }
  return out;
}

/** Spreadsheet truthiness: zero and empty are false, everything else is true. */
function truthy(value: FormulaValue): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (value === null || value === "") return false;
  return value !== "FALSE";
}

/** Compare two values the way a spreadsheet does — numbers if both are. */
function compare(left: FormulaValue, right: FormulaValue): number {
  const a = numberOf(left);
  const b = numberOf(right);
  if (a !== null && b !== null) return a - b;
  return toText(left).localeCompare(toText(right));
}

/** The smallest or largest of some numbers; nothing has no extreme but zero. */
function extreme(
  numbers: readonly number[],
  pick: (...values: number[]) => number
): FormulaValue {
  const result: FormulaValue = numbers.length > 0 ? pick(...numbers) : 0;
  return result;
}

/** The mean, or the error that says there was nothing to average. */
function mean(numbers: readonly number[]): FormulaValue {
  // Zero would be a number someone acts on; an error is one they check.
  const result: FormulaValue =
    numbers.length === 0
      ? FORMULA_ERRORS.divideByZero
      : numbers.reduce((total, n) => total + n, 0) / numbers.length;
  return result;
}

/** Round to a number of places, propagating either operand's error. */
function round(value: FormulaValue, places: FormulaValue): FormulaValue {
  const error = firstError([value, places]);
  const factor = 10 ** (numberOf(places) ?? 0);
  const scaled = Math.round((numberOf(value) ?? 0) * factor) / factor;
  const result: FormulaValue = error ?? scaled;
  return result;
}

/** Negate, propagating an error operand. */
function negate(value: FormulaValue): FormulaValue {
  const n = toNumber(value);
  const result: FormulaValue = isFormulaError(n) ? n : -(numberOf(n) ?? 0);
  return result;
}

/** Absolute value, propagating an error operand. */
function absolute(value: FormulaValue): FormulaValue {
  const n = toNumber(value);
  const result: FormulaValue = isFormulaError(n)
    ? n
    : Math.abs(numberOf(n) ?? 0);
  return result;
}

/** Which branch of an IF to take, with an error test short-circuiting. */
function chooseBranch(args: readonly FormulaValue[]): FormulaValue {
  const test = args[0] ?? null;
  const taken: FormulaValue = truthy(test)
    ? (args[1] ?? true)
    : (args[2] ?? false);
  const result: FormulaValue = isFormulaError(test) ? test : taken;
  return result;
}

/** The first value that is actually there — COALESCE's whole job. */
function firstPresent(args: readonly FormulaValue[]): FormulaValue {
  const found = args.find(
    (value) => value !== null && value !== "" && !isFormulaError(value)
  );
  const result: FormulaValue = found ?? null;
  return result;
}

/** The built-in functions, by upper-case name. */
const FUNCTIONS: Record<
  string,
  (args: readonly FormulaValue[]) => FormulaValue
> = {
  SUM: (args) =>
    firstError(args) ?? numbersIn(args).reduce((total, n) => total + n, 0),
  MIN: (args) => firstError(args) ?? extreme(numbersIn(args), Math.min),
  MAX: (args) => firstError(args) ?? extreme(numbersIn(args), Math.max),
  AVG: (args) => firstError(args) ?? mean(numbersIn(args)),
  ABS: (args) => absolute(args[0] ?? 0),
  ROUND: (args) => round(args[0] ?? 0, args[1] ?? 0),
  IF: (args) => chooseBranch(args),
  AND: (args) => firstError(args) ?? args.every((value) => truthy(value)),
  OR: (args) => firstError(args) ?? args.some((value) => truthy(value)),
  NOT: (args) => firstError(args) ?? !truthy(args[0] ?? null),
  CONCAT: (args) => firstError(args) ?? args.map((v) => toText(v)).join(""),
  LEN: (args) => firstError(args) ?? toText(args[0] ?? null).length,
  UPPER: (args) => firstError(args) ?? toText(args[0] ?? null).toUpperCase(),
  LOWER: (args) => firstError(args) ?? toText(args[0] ?? null).toLowerCase(),
  // The one function that deliberately does NOT propagate: its whole job is
  // to answer "what should I use when this is missing".
  COALESCE: (args) => firstPresent(args),
};

/** The comparison operators, as a set the dispatcher can ask. */
const COMPARISONS = new Set(["=", "<>", "<", "<=", ">", ">="]);

/** One comparison, resolved from the ordering of the two operands. */
function compareWith(
  op: string,
  left: FormulaValue,
  right: FormulaValue
): boolean {
  const order = compare(left, right);
  if (op === "=") return order === 0;
  if (op === "<>") return order !== 0;
  if (op === "<") return order < 0;
  if (op === "<=") return order <= 0;
  if (op === ">") return order > 0;
  return order >= 0;
}

/** The four arithmetic operators over two known numbers. */
function arithmetic(op: string, left: number, right: number): FormulaValue {
  if (op === "+") return left + right;
  if (op === "-") return left - right;
  if (op === "*") return left * right;
  // Division. A zero divisor is the error a spreadsheet is famous for, and
  // returning Infinity instead would be a number nobody can act on.
  const quotient: FormulaValue =
    right === 0 ? FORMULA_ERRORS.divideByZero : left / right;
  return quotient;
}

/** A comparison or an arithmetic result, once the operands are known good. */
function binaryResult(
  op: string,
  left: FormulaValue,
  right: FormulaValue
): FormulaValue {
  if (COMPARISONS.has(op)) return compareWith(op, left, right);
  const a = toNumber(left);
  const b = toNumber(right);
  const error = firstError([a, b]);
  const result: FormulaValue =
    error ?? arithmetic(op, numberOf(a) ?? 0, numberOf(b) ?? 0);
  return result;
}

/** Apply a binary operator to two already-evaluated values. */
function applyBinary(
  op: string,
  left: FormulaValue,
  right: FormulaValue
): FormulaValue {
  const error = firstError([left, right]);
  if (error) return error;
  if (op === "&") return toText(left) + toText(right);
  return binaryResult(op, left, right);
}

/** One column reference, or `#NAME?` when the row has no such column. */
function readRef(key: string, scope: FormulaScope): FormulaValue {
  const value = scope(key);
  const result: FormulaValue =
    value === undefined ? FORMULA_ERRORS.name : value;
  return result;
}

/** One function call, or `#NAME?` when there is no such function. */
function callFunction(
  name: string,
  args: readonly FormulaValue[]
): FormulaValue {
  const fn = FUNCTIONS[name];
  const result: FormulaValue = fn ? fn(args) : FORMULA_ERRORS.name;
  return result;
}

/**
 * Evaluate a parsed formula against one row.
 *
 * Never throws. Every failure is one of {@link FORMULA_ERRORS}, and an error
 * anywhere in an expression comes out of it rather than being counted as
 * zero.
 *
 * @param node - The parsed formula.
 * @param scope - Reads a column's value; `undefined` for a column that is not
 *   there, which becomes `#NAME?`.
 * @returns The value for the cell.
 */
export function evaluateFormula(
  node: FormulaNode,
  scope: FormulaScope
): FormulaValue {
  if (node.kind === "number") return node.value;
  if (node.kind === "string") return node.value;
  if (node.kind === "ref") return readRef(node.key, scope);
  if (node.kind === "unary") {
    return negate(evaluateFormula(node.operand, scope));
  }
  if (node.kind === "binary") {
    return applyBinary(
      node.op,
      evaluateFormula(node.left, scope),
      evaluateFormula(node.right, scope)
    );
  }
  return callFunction(
    node.name,
    node.args.map((arg) => evaluateFormula(arg, scope))
  );
}

/** The functions a formula may call, for a UI that wants to list them. */
export const FORMULA_FUNCTIONS: readonly string[] = Object.keys(FUNCTIONS);
