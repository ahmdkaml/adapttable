# React table row grouping — group rows with aggregates & expand/collapse

▶ **Try it live:** [open a Mantine starter in StackBlitz](https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine?file=src%2FApp.tsx) — this page's feature is already wired in `src/App.tsx` (`groupBy="role"` + `groupAggregates`); edit it in the browser, no install. [Other UI kits →](./getting-started.md#try-it-in-stackblitz)

▶ **See it working:** [collapse groups and read per-group subtotals in the live demo](https://orwa-mahmoud.github.io/adapttable/demo/grouping/) — a real table you can click, not a recording.

Each subtotal renders in its own column's cell, so it sits under the column it
totals — on a mobile card, where there are no columns to align to, the same
numbers appear captioned by their column instead. A custom renderer can place
them the same way with `groupRowLayout` and `groupAggregateEntries`.

Group rows by one column with `groupBy` and optional per-group subtotals via
`groupAggregates` — the **same mapper signature as `summaryRow`**. Omit
`groupBy` and the table never inserts group header rows (package DNA: opt-in).

## Footers and grand totals

`groupFooters` closes every group with a row carrying the same aggregates its
header carries:

```tsx
<DataTable
  data={PEOPLE}
  columns={columns}
  rowKey={(r) => r.id}
  groupBy="team"
  groupAggregates={(rows) => ({ budget: sum(rows) })}
  groupFooters
  summaryRow={(rows) => ({ budget: sum(rows) })}
/>
```

The totals then read at the bottom of a group as well as the top — which is
where the reader of a long group is by the time they want them. A footer shows
no chevron and no checkbox: the header already owns both. Nested groups each get
their own, innermost first, and a **collapsed** group shows none at all — its
header is already carrying the numbers, with nothing between them.

`summaryRow` is the table's grand total, and under grouping it totals the whole
filtered set rather than a page of it. The two compose: per-group footers, one
grand total.

On mobile the footer is a card of its own after the group's cards, captioned the
same way. Exports are unaffected — a footer is chrome, not a row, so a CSV
carries the data and nothing else.

Each footer is captioned through `labels.groupTotal`, translated in all
seventeen locales, and carries `data-adapttable-part="group-footer-row"` /
`group-footer-cell` (plus the `groupFooterRow` / `groupFooterCell` class hooks
in `@adapttable/unstyled`).

## Nested groups

`groupBy` also takes an ordered list, and each key nests inside the one before
it:

```tsx
<DataTable
  data={PEOPLE}
  columns={columns}
  rowKey={(r) => r.id}
  groupBy={["team", "status"]}
/>
```

> Core (12)
> &nbsp;&nbsp;active (7)
> &nbsp;&nbsp;blocked (5)
> Platform (9)
> &nbsp;&nbsp;active (9)

Every header describes its **whole subtree**: the count beside "Core" is all
twelve of its people, and its `groupAggregates` cells total the same twelve.
Deeper levels indent by logical padding, so nesting mirrors in Arabic and
Hebrew without a second rule.

Each node collapses on its own — "Core > blocked" and "Platform > blocked" are
different groups with different keys, so closing one leaves the other open, and
closing a parent hides its whole subtree in one step. Collapsed keys serialize
exactly as they did with one level.

In the URL and in saved views the keys travel as one comma-separated value —
`?groupBy=team,status` — so a link built before nesting existed still works,
and `onGroupByChange` reports the keys as a list.

## Example

```tsx
import { DataTable } from "@adapttable/mantine"; // or mui, chakra, antd, radix, base-ui, shadcn, unstyled

interface Person {
  id: string;
  name: string;
  team: string;
  budget: number;
}

const PEOPLE: Person[] = [
  { id: "1", name: "Aisha", team: "Core", budget: 42_000 },
  { id: "2", name: "Jonas", team: "Platform", budget: 38_000 },
  { id: "3", name: "Mei", team: "Core", budget: 51_000 },
];

export function People() {
  return (
    <DataTable
      data={PEOPLE}
      columns={[
        { key: "name", sortable: true },
        { key: "team", sortable: true },
        {
          key: "budget",
          accessor: (r) => `$${r.budget.toLocaleString()}`,
          sortValue: (r) => r.budget,
        },
      ]}
      rowKey={(r) => r.id}
      groupBy="team"
      groupAggregates={(rows) => ({
        budget: (
          <b>${rows.reduce((sum, r) => sum + r.budget, 0).toLocaleString()}</b>
        ),
      })}
    />
  );
}
```

## How it works

- **Opt-in.** Pass `groupBy` (a column key) or set `source.groupBy` via
  `useFrontendData` / URL state — without it, grouping stays fully dormant.
- **Single level.** One grouping column at a time (no nested groups, no
  drag-to-group panel).
- **Frontend tier only.** Grouping needs the full filtered row set in memory
  (`allFilteredRows`). Server-paginated sources log a dev-mode warning and
  ignore grouping — see [Data tiers](./data-tiers.md).
- **Shared mapper.** `groupAggregates(rows)` uses the same
  `(rows) => Partial<Record<string, ReactNode>>` shape as `summaryRow`; reuse
  one function for both if the math is identical — or build both with
  `aggregate()` (below).
- **Expand / collapse.** Groups start expanded. Collapse state is ephemeral
  (not URL-synced). `groupBy` itself serializes to the URL like sort and
  filters.
- **Selection.** When row checkboxes are enabled, each group header exposes a
  tri-state checkbox over its leaf rows.

## Aggregate without writing the maths

The mapper above is a function you write. When the sums are ordinary, declare
them instead and `aggregate()` returns that same mapper:

```tsx
import { aggregate } from "@adapttable/core";

<DataTable
  groupBy="role"
  groupAggregates={aggregate({ budget: "sum", team: "count" }, { columns })}
  summaryRow={aggregate({ budget: "sum" }, { columns })}
  columns={columns}
  // …
/>;
```

Built in: `sum`, `avg`, `count`, `min`, `max`. Pass your own function for
anything else — it receives the values found for that column and returns the
cell:

```tsx
const distinct = (values) => new Set(values).size;
groupAggregates={aggregate({ team: distinct })}
```

Passing `columns` lets values resolve through a column's `sortValue`, exactly
as sorting and grouping do, so a formatted cell still aggregates on its
underlying number. Add `format` to shape the result for display:

```tsx
aggregate(
  { budget: "sum" },
  { columns, format: (v) => (typeof v === "number" ? money.format(v) : v) }
);
```

Two behaviours worth knowing, because they are choices rather than accidents:
a missing value is skipped rather than counted as zero, so `count` reports the
values a column actually has; and while `sum` of nothing is `0`, `avg`, `min`
and `max` of nothing are `undefined` — an average of no numbers is
unanswerable, not zero.

## Options

| Prop / field                | Type                                                            | Default | Description                                                                                 |
| --------------------------- | --------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `groupBy`                   | `string \| null`                                                | —       | Column key to group by; its presence arms grouping (still requires a frontend data source). |
| `onGroupByChange`           | `(groupBy: string \| null) => void`                             | —       | Controlled change channel; falls back to `source.setGroupBy`.                               |
| `groupAggregates`           | `(rows: readonly TRow[]) => Partial<Record<string, ReactNode>>` | —       | Per-group cells — **same signature as `summaryRow`**. Omit for headers without subtotals.   |
| `collapsedGroupIds`         | `readonly string[]`                                             | —       | Controlled collapsed group keys (ephemeral — not URL-synced).                               |
| `onCollapsedGroupIdsChange` | `(ids: string[]) => void`                                       | —       | Controlled collapse channel; uncontrolled mode uses internal state.                         |
| `labels`                    | `TableLabels`                                                   | English | Override `expandGroup`, `collapseGroup`, and `groupCount` for header controls.              |

## Grouped tables are a full-set view

With `groupBy` active the table renders **every filtered row** (grouped),
and the chrome agrees with the screen: the footer count describes the
rendered set, header select-all covers all rendered rows, page-scope CSV
export contains exactly what you see, and the rows-per-page control hides
(page size has no effect). Ungroup to return to normal pagination.

## Headless grouping

The grouping model is exported so custom tables can render the same
single-level flat structure the adapters do:

| Export                                         | Purpose                                                                                        |
| ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| `buildGroupedFlatModel` / `GroupedFlatEntry`   | Partition leaf rows into a flat list — group header, then its leaves (omitted when collapsed). |
| `groupValueKey`                                | Stable, type-tagged string key for a group bucket (`5` and `"5"` never share one).             |
| `useGroupCollapse` / `GroupCollapseState`      | Ephemeral collapse state — groups default to expanded; not URL-synced.                         |
| `GroupAggregatesFn`                            | The `(rows) => Partial<Record<string, ReactNode>>` mapper shared with `summaryRow`.            |
| `formatGroupLabel`                             | The header label for a bucket value (localized blank-value fallback included).                 |
| `groupSelectionState` / `HeaderSelectionState` | Tri-state for a group checkbox over its leaf ids — the same enum the header select-all uses.   |
| `windowGroupedEntries`                         | Slice a flat grouped model to a virtual window (see [Virtualization](./virtualization.md)).    |

## Notes

- Bucketing uses the column's `sortValue` when present, otherwise a path lookup
  on the column key — never the JSX `accessor`.
- Works on desktop rows and mobile cards, LTR and RTL, with and without
  `virtualize` (virtual windows count collapsed groups as one row).
- Out of scope (by design): multi-level nesting, pivot mode, drag-to-group,
  and Excel-style aggregation pickers.
- Ant Design maps group headers onto its high-level `Table` via custom row
  rendering; every other kit renders native group header rows/cards.

See it live in the [demo](https://orwa-mahmoud.github.io/adapttable/demo/) —
rows are grouped by team with a budget subtotal per group.
