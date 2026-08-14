# React table full-width and separator rows

▶ **Try it live:** [open a Mantine starter in StackBlitz](https://stackblitz.com/github/orwa-mahmoud/adapttable/tree/main/starters/mantine?file=src%2FApp.tsx) — pass `extraRows`. [Other UI kits →](./getting-started.md#try-it-in-stackblitz)

▶ **See it working:** [the live demo](https://orwa-mahmoud.github.io/adapttable/demo/) — turn **Extras** on.

A separator is a thin rule. A full-width row is one cell that spans the
table. Both are host-injected slots in the same `kind`-tagged list grouping
already uses — omit `extraRows` and nothing is inserted.

```tsx
import { DataTable } from "@adapttable/mantine";

<DataTable
  data={rows}
  columns={columns}
  rowKey={(row) => row.id}
  extraRows={[
    { key: "s", kind: "separator", beforeRowId: "2" },
    {
      key: "note",
      kind: "fullWidth",
      render: () => <em>Shipped Friday.</em>,
    },
  ]}
/>;
```

`beforeRowId` is a data-row id. Omit it to append after the last data row.
Several extras that share a target keep the host's order.

The slots join the grouping entry list when grouping is on, so they window
with the groups. On a flat or tree table they splice into the rendered
body. Mobile cards keep the same slots: a rule between cards, or a
full-width note.

Extras are content, not table state — nothing goes in the URL or a saved
view.
