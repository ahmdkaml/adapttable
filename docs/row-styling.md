# React table row styling and heights

▶ **Try it live:** [open a Mantine starter in StackBlitz](https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine?file=src%2FApp.tsx) — pass `rowStyle` or `rowHeight`. [Other UI kits →](./getting-started.md#try-it-in-stackblitz)

▶ **See it working:** [the live demo](https://orwa-mahmoud.github.io/adapttable/demo/) — turn **Style** on.

`rowClassName` already appends a class. `rowStyle` and `rowHeight` are the
inline half of the same hook: a function of `(row, index)`, applied on
desktop rows and mobile cards alike. Omit both and nothing is set.

```tsx
import { DataTable } from "@adapttable/mantine";

<DataTable
  data={rows}
  columns={columns}
  rowKey={(row) => row.id}
  rowStyle={(row) =>
    row.overdue ? { backgroundColor: "var(--overdue)" } : undefined
  }
  rowHeight={(row) => (row.tall ? 72 : 48)}
/>;
```

A number `rowHeight` is every row. A function is per row. Height wins when
`rowStyle` also names `height` — `rowHeight` is the dedicated override.

Pass a light fill and a dark fill — AdaptTable does not pick those colours.
`light-dark()` follows the page `color-scheme` (and RTL uses logical
properties, so `text-align: start` is already the extra's alignment):

```tsx
rowStyle={(row) =>
  row.overdue
    ? {
        backgroundColor:
          "light-dark(oklch(0.93 0.08 95), oklch(0.38 0.07 85))",
      }
    : undefined
}
```

CSS variables that flip under the host's dark class work the same way.

The row virtualizer's `estimateSize` reads the same value, so a
variable-height table still windows. `measureElement` stays authoritative
for what the browser actually laid out.

Style and height are functions of the row, not table state — nothing goes
in the URL or a saved view.
