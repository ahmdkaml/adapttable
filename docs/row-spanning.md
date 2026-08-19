# React table row and column spanning

▶ **Try it live:** [open a Mantine starter in StackBlitz](https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine?file=src%2FApp.tsx) — pass `getCellSpan` or `column.colSpan`. [Other UI kits →](./getting-started.md#try-it-in-stackblitz)

▶ **See it working:** [the live demo](https://orwa-mahmoud.github.io/adapttable/demo/) — turn **Span cells** on. Team is written once down the people who share it. Person and Email stay their own cells.

A span is a rectangle. The origin cell carries `colSpan` / `rowSpan`; every
covered neighbour is omitted from that row's cell list, so every kit maps one
list instead of `columns.map`. Omit `getCellSpan` and every `column.colSpan` /
`column.rowSpan` and the list is one cell per column — nothing extra renders.

By default the origin is painted like a spreadsheet merge: **centered
content, one fill** across the whole span (`data-cell-span` is
`"colSpan x rowSpan"`, e.g. `"1x5"`). That is `cellSpanAppearance="merged"`.
Pass `"plain"` for geometry only — same chrome as a 1×1 cell — if you want
to draw a calendar-style bar yourself. Override the fill with
`--adapttable-cell-span-fill`, or the unstyled `cellSpan` class hook.

```tsx
import { DataTable } from "@adapttable/mantine";

<DataTable
  data={rows}
  columns={columns}
  rowKey={(row) => row.id}
  getCellSpan={({ column, row, rowIndex }) => {
    if (column.key !== "team") return undefined;
    if (rows[rowIndex - 1]?.team === row.team) return undefined;
    let rowSpan = 1;
    while (rows[rowIndex + rowSpan]?.team === row.team) rowSpan += 1;
    return rowSpan > 1 ? { rowSpan } : undefined;
  }}
/>;
```

A column that always spans can say so on the definition:

```tsx
{ key: "team", header: "Team", accessor: (row) => row.team, rowSpan: 2 }
```

`getCellSpan` wins when both are set. Spans clamp to the remaining grid.
They clip at a **column pin** boundary (a pinned cell and a scrolling cell
cannot share one `<td>`) and at the **column window**: a span that starts
off-screen continues on the first visible column it covers.

Arrow keys skip a covered cell. CSV / XLSX write the origin value once and
leave covered cells empty.

## Mobile and the URL

Cards are a list of fields, not a grid — they ignore geometry and still
show every column. Spans are derived from data, so there is nothing to
put in the URL or a saved view.

Row spans stay inside one tbody. A pin section and the scroll body do not
share a span.
