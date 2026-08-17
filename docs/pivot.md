# React pivot table — rows, columns and measures

Grouping answers "what is the total per team". A pivot answers "what is the
total per team **per quarter**" — and that second dimension has to become
columns that were never in the data.

`@adapttable/core/pivot` is a separate entry, so a table that never pivots
never downloads the engine. It costs 1.4 KB gzipped to the tables that import
it and nothing to the rest, which the bundle budget checks on every build.

## The shape

```tsx
import { pivot } from "@adapttable/core/pivot";

const result = pivot(sales, {
  rows: ["region", "team"], // down the side, outermost first
  columns: ["quarter"], // across the top
  measures: [{ key: "amount", agg: "sum" }],
});
```

`pivot` is the whole calculation and none of the rendering. It returns:

| Field          | What it is                                                            |
| -------------- | --------------------------------------------------------------------- |
| `columnLeaves` | The rendered columns, left to right — the order every row's cells use |
| `columnTree`   | The header tree, each node carrying the `span` its header cell needs  |
| `rows`         | Every line of the body, in render order                               |
| `rowDepth`     | How many dimensions are down the side                                 |

Each line has a `kind` — `"leaf"`, `"subtotal"` or `"grandTotal"` — a `depth`
for indentation, a `label`, a `count` of the source rows it covers, and one
cell per entry of `columnLeaves`.

## Measures

A measure is a column key and an aggregation:

```tsx
measures: [
  { key: "amount", agg: "sum" },
  { key: "amount", agg: "count", label: "Deals" },
];
```

`sum`, `avg`, `count`, `min` and `max` are built in; anything else is a
function over the values found, the same `Aggregator` shape the summary row
and group aggregates take:

```tsx
measures: [{ key: "amount", agg: (values) => `${values.length} sales` }];
```

Every measure repeats under every column path, so two measures under three
quarters is six columns — the header tree's spans already account for it.

Values resolve through a column's `sortValue` when you pass `columns`, exactly
as sorting, grouping and the summary row do. A pivot that read raw fields
would disagree with the footer of the same table:

```tsx
pivot(sales, config, { columns });
```

## Subtotals, totals and collapsing

Subtotals are on by default: every level above the innermost gets a line, and
those lines come **before** their children rather than after. That is what
makes collapsing work — a collapsed group still shows its own line with its
own totals instead of vanishing.

```tsx
const result = pivot(sales, config, { collapsed: new Set(["EU"]) });
```

A subtotal line's `key` is its collapse key. Collapsing changes what is shown
and never what is computed: the grand total is the same number either way.

Turn either off with `subtotals: false` / `grandTotals: false`. The grand-total
**column** only appears when something splits the columns — without column
dimensions it would repeat the only column there is.

## What it does not throw away

A row whose dimension value is missing gets its own bucket, labelled `—`
(`PIVOT_BLANK`), rather than being dropped. Rows falling into no bucket and
quietly disappearing is how a pivot table ends up lying about a total.

A value that is not summable is absent, not zero — a missing budget is not a
$0 budget, so a cell with nothing to add up reads as empty.

## Building the configuration

The panel a user drags fields around in is a separate concern from the pivot
itself, and the part of it that is not a widget lives here too:

```tsx
import {
  assignField,
  availableFields,
  moveField,
  removeField,
  setMeasureAgg,
  EMPTY_PIVOT_CONFIG,
} from "@adapttable/core/pivot";

const [config, setConfig] = useState(EMPTY_PIVOT_CONFIG);

setConfig(assignField(config, "team", "rows")); // put Team on the rows axis
setConfig(moveField(config, "rows", 1, -1)); // one step out — the keyboard path
setConfig(setMeasureAgg(config, 0, "avg"));
```

Every operation returns a new configuration and none of them can produce an
invalid one: placing a dimension on one axis takes it off the other rather than
pivoting the same field twice, an index past the end appends, and a step past
either end is a no-op rather than a wrap. Measures are the exception to "one
field, one axis" — summing and counting the same column in one pivot is an
ordinary thing to want, so `assignField` adds a measure rather than moving one.

`availableFields(fields, config)` is what the panel's unused list shows, and
`isPivotReady(config)` is false until something fills the cells — a pivot with
no measure is a half-built configuration, not an error.

## The configuration panel

`PivotPanelChrome` from `@adapttable/core/adapter` is the panel itself: three
zones, the fields in each, and the controls that move them. Structure, part
names, ordering and labels live in core; every visible control is a required
slot the adapter fills with its own kit's component, so a Mantine panel is
built from Mantine buttons and an antd panel from antd buttons.

Every adapter ships it pre-wired as `PivotPanel`, so a host imports one
component rather than assembling slots:

```tsx
import { PivotPanel } from "@adapttable/mantine";

<PivotPanel fields={fields} config={config} onChange={setConfig} />;
```

Underneath, `PivotPanel` is `PivotPanelChrome` with that kit's slots filled in:

```tsx
<PivotPanelChrome
  fields={fields}
  config={config}
  onChange={setConfig}
  slots={slots}
/>
```

Its `PivotPanelChromeProps` take the fields, the configuration and a change
handler — the panel never holds the configuration itself. `PivotPanelSlots`
names the five pieces a kit supplies, each with its own props type:
`PivotPanelSurfaceProps` for the body, `PivotZoneProps` for a titled zone,
`PivotFieldProps` for one field and its move/remove controls, `PivotAddProps`
for the control that adds a field, and `PivotAggProps` for a measure's
aggregation chooser.

Every pivot UI in every spreadsheet is drag-and-drop, and every one of them is
unusable without a mouse. This panel is keyboard-first instead: each field
carries buttons that move it one step, so the whole thing is drivable with Tab
and Enter. A kit that wants dragging can add it on top — nothing here forbids
it and nothing depends on it. The move controls are withheld at each end
rather than disabled, because a field at the top has nowhere up to go.

Drop it into a [side panel](./customization.md) as that panel's content, and
the pivot configuration lives beside the table rather than over it.

## Pivoting on the server

A pivot over ten million rows is not a browser's job. When the server can do
it, send the configuration and translate the answer:

```tsx
import { serverPivotResult } from "@adapttable/core/pivot";

const result = serverPivotResult(page, { config });
```

`serverPivotResult` is a translator, not a second engine. The server decides
the arithmetic and the ordering; core rebuilds the column tree, the spans and
the leaf ordering from the paths the server named, so the result is the _same_
`PivotResult` the local engine returns and every adapter renders one thing.

The wire format is small on purpose — a `QueryPivotPage`:

```ts
{
  // column-dimension paths, outermost value first, in display order.
  // One entry per PATH, not per rendered column: the measures multiply them.
  columns: [["EU", "Q1"], ["EU", "Q2"], ["US", "Q1"]],
  rows: [
    { path: ["EU"], cells: [30, 20, 0], subtotal: true },
    { path: ["EU", "Alpha"], cells: [30, 20, 0], count: 12 },
  ],
  total: { path: [], cells: [30, 20, 10] },
}
```

`count`, `subtotal` and `total` are optional: a server that can pivot but not
count, or that has no subtotals, should not have to send empty fields to say
so. A cell the server omits is an empty cell, never a zero — the same rule the
local engine follows for a value that will not add up.

## In the URL

A pivot is the most expensive table state there is to rebuild by hand — two
axes, an order on each, and a measure list — which makes it the state most
worth putting in a link:

```tsx
import { usePivotUrlState } from "@adapttable/core/pivot";

const { config, onConfigChange } = usePivotUrlState();

<PivotPanel fields={fields} config={config} onChange={onConfigChange} />;
```

The parameter is compact and readable rather than JSON in a query string:

```
?pivot=rows:region,team;cols:quarter;sum:amount;count:amount
```

`serializePivot` and `deserializePivot` are exported for saved views and
anywhere else a `PivotConfig` has to be stored. The round trip is tested, not
assumed, and a hand-edited value degrades to a simpler pivot instead of
throwing — a URL is user input.

Both are also on [`@adapttable/core/query`](./server-queries.md#decoding-a-parameter-yourself),
the React-free entry, so a route handler can read the parameter a shared link
carries without importing the engine or React.

An empty pivot writes no parameter, and `urlKey` namespaces it so two tables
can share one URL.

A custom aggregator has no URL form, so a measure carrying one keeps working
in memory and is left out of the link. Writing `sum` instead would quietly
change what the link computes.

Related: [row grouping](./row-grouping.md) ·
[aggregation](./row-grouping.md#aggregates) · [API reference](./api.md)
