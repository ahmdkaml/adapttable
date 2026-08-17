# React table formulas — spreadsheet columns computed from your rows

A column whose value is `=[Unit Price] * Quantity`, typed by the user rather
than written by you.

`@adapttable/core/formula` is a separate entry, so a table with no computed
columns never downloads a parser. It costs 2.6 KB gzipped to the tables that
import it and nothing to the rest, which the bundle budget checks on every
build.

## The shape

```tsx
import { buildFormulaColumns } from "@adapttable/core/formula";

const {
  columns: computed,
  errors,
  cycles,
} = buildFormulaColumns<Row>([
  { key: "total", header: "Total", formula: "=[Unit Price] * Quantity" },
  { key: "withTax", header: "With tax", formula: "=total * 1.2" },
]);

<DataTable
  data={rows}
  columns={[...columns, ...computed]}
  rowKey={(r) => r.id}
/>;
```

A formula may reference a data field or another formula column by name.
Bracket a name that contains spaces — `[Unit Price]` — which is why the
brackets exist rather than an escaping rule.

`errors` names the formulas that would not parse, with the parser's message;
`cycles` names the keys that reference each other in a loop. Both are reported
rather than thrown, because a formula bar has to show something useful while
someone is still typing, and half a formula is the normal state of one being
written.

## A formula is parsed, never evaluated

The rule the parser exists to keep: **a formula is text, and it is parsed.**
It never reaches `eval`, `new Function`, or anything else that would run it as
JavaScript.

A user-typed formula is untrusted input in exactly the way a URL is. A table
that evaluates one has handed the page to whoever typed it — and in a
[saved view](./saved-views.md) that can be shared, to whoever sent the link.

The grammar is deliberately small, because a formula language grows one "just
add" at a time until it is a programming language nobody can secure:

```
expression → comparison
comparison → sum ( ("=" | "<>" | "<" | "<=" | ">" | ">=") sum )?
sum        → product ( ("+" | "-" | "&") product )*
product    → unary ( ("*" | "/") unary )*
unary      → "-" unary | primary
primary    → number | string | reference | call | "(" expression ")"
```

`&` concatenates, as it does in a spreadsheet.

## Values are tagged, and errors are values

A value is `{ kind: "number" | "text" | "boolean" | "blank" | "error" }`
rather than a bare union of primitives. That costs a `.kind` at every use and
buys two things.

An error stops being a string. With sentinel strings, data that genuinely
contains the text `#REF!` is indistinguishable from a cell that failed —
`isFormulaError` can tell them apart because one is tagged and the other is
not.

And a formula that cannot produce a number produces an error value rather than
throwing: `#DIV/0!`, `#VALUE!`, `#NAME?`, `#CYCLE!`, `#ERROR!`. They propagate
the way a spreadsheet's do — an error inside `SUM(a, b)` comes out of the
`SUM` instead of being counted as zero, so a wrong number never gets quietly
totalled. `COALESCE` is the one function that deliberately does not propagate,
because answering "what should I use when this is missing" is its whole job.

A field the engine has no kind for — an object, a function — is `#VALUE!`
rather than its stringification. `[object Object]` in a cell is not a
rendering of the data; it is a rendering of nobody having decided.

## Sorting and export

A formula column sorts by its **value**, never by the text in the cell. A
number orders numerically however it is formatted, so `$1,240.00` cannot land
before `$90.00`; `=UPPER(name)` orders alphabetically; a boolean puts `FALSE`
before `TRUE`.

A blank and an error have no place in an ordering, so both group at the **end**
of the column — in either direction, the way a spreadsheet leaves an error —
and rows tied there keep the order they already had. What matters is not the
order among broken cells but that they collect somewhere predictable instead of
being counted as zero and scattered among real values.

Export receives the same value a spreadsheet would. Formatting is never applied
to an error: showing `#DIV/0!` as `$#DIV/0!` would hide which cell went wrong.

## Building a formula bar

`FORMULA_FUNCTIONS` lists the function names the engine knows, for an
autocomplete. `parseFormula` returns a tree or the reason it could not, and
`formulaRefs` names the columns a formula depends on.

Related: [pivot tables](./pivot.md) · [row grouping](./row-grouping.md) ·
[API reference](./api.md)
